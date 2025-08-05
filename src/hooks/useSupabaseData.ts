import { useState, useEffect } from 'react';
import { supabase, Officer, CreditTransaction, Query, OfficerRegistration, LiveRequest, API, RatePlan, PlanAPI, ManualRequest } from '../lib/supabase';
import toast from 'react-hot-toast';
import { useNotification } from '../contexts/NotificationContext'; // Import useNotification
import { addDays, isPast } from 'date-fns'; // Import date-fns utilities

export const useSupabaseData = () => {
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [queries, setQueries] = useState<Query[]>([]);
  const [registrations, setRegistrations] = useState<OfficerRegistration[]>([]);
  const [liveRequests, setLiveRequests] = useState<LiveRequest[]>([]);
  const [apis, setAPIs] = useState<API[]>([]);
  const [ratePlans, setRatePlans] = useState<RatePlan[]>([]);
  const [planAPIs, setPlanAPIs] = useState<PlanAPI[]>([]);
  const [manualRequests, setManualRequests] = useState<ManualRequest[]>([]); // Added manualRequests state
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<any>(null);

  const { addNotification } = useNotification(); // Use the notification hook

  // Load all data
  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadOfficers(),
        loadTransactions(),
        loadQueries(),
        loadRegistrations(),
        loadLiveRequests(),
        loadAPIs(),
        loadRatePlans(),
        loadPlanAPIs(),
        loadManualRequests() // Load manual requests
      ]);
      calculateDashboardStats();
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadOfficers = async () => {
    const { data, error } = await supabase
      .from('officers')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    setOfficers(data || []);
  };

  const loadTransactions = async () => {
    const { data, error } = await supabase
      .from('credit_transactions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    setTransactions(data || []);
  };

  const loadQueries = async () => {
    const { data, error } = await supabase
      .from('queries')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (error) throw error;
    setQueries(data || []);
  };

  const loadRegistrations = async () => {
    const { data, error } = await supabase
      .from('officer_registrations')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    setRegistrations(data || []);
  };

  const loadLiveRequests = async () => {
    const { data, error } = await supabase
      .from('live_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) throw error;
    setLiveRequests(data || []);
  };

  const loadAPIs = async () => {
    const { data, error } = await supabase
      .from('apis')
      .select('*, api_key, key_status, usage_count, last_used')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    setAPIs(data || []);
  };

  const loadRatePlans = async () => {
    const { data, error } = await supabase
      .from('rate_plans')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    setRatePlans(data || []);
  };

  const loadPlanAPIs = async () => {
    const { data, error } = await supabase
      .from('plan_apis')
      .select('*');
    
    if (error) throw error;
    setPlanAPIs(data || []);
  };

  // New function to load manual requests
  const loadManualRequests = async () => {
    const { data, error } = await supabase
      .from('manual_requests')
      .select('*, officers(id, name, email, mobile)') // Join with officers table
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    setManualRequests(data || []);
  };

  const calculateDashboardStats = () => {
    const stats = {
      total_officers: officers.length,
      active_officers: officers.filter(o => o.status === 'Active').length,
      total_queries_today: queries.length > 0 ? queries.filter(q => {
        const today = new Date().toDateString();
        return new Date(q.created_at).toDateString() === today;
      }).length : 0,
      successful_queries: queries.filter(q => q.status === 'Success').length,
      failed_queries: queries.filter(q => q.status === 'Failed').length,
      total_credits_used: transactions
        .filter(t => t.action === 'Deduction')
        .reduce((sum, t) => sum + Math.abs(t.credits), 0),
      revenue_today: 0,
      average_response_time: 1.8
    };
    setDashboardStats(stats);
  };

  // CRUD Operations for Officers
  const addOfficer = async (officerData: Omit<Officer, 'id' | 'created_at' | 'updated_at' | 'registered_on' | 'last_active' | 'total_queries'>) => {
    try {
      // Extract password and remove it from the data object
      const { password, ...officerDataWithoutPassword } = officerData as any;
      
      // If plan_id is provided, get the plan's default credits
      let finalCreditsRemaining = officerData.credits_remaining;
      let finalTotalCredits = officerData.total_credits;
      
      if (officerData.plan_id) {
        const selectedPlan = ratePlans.find(plan => plan.id === officerData.plan_id);
        if (selectedPlan) {
          finalCreditsRemaining = selectedPlan.default_credits;
          finalTotalCredits = selectedPlan.default_credits;
        }
      }
      
      // Hash the password before storing (in a real app, this should be done on the server)
      const passwordToHash = password && password.trim() ? password : 'defaultpass';
      const passwordHash = `$2b$10$${btoa(passwordToHash).slice(0, 53)}`;
      
      const { data, error } = await supabase
        .from('officers')
        .insert([{
          ...officerDataWithoutPassword,
          password_hash: passwordHash,
          total_queries: 0,
          credits_remaining: finalCreditsRemaining,
          total_credits: finalTotalCredits
        }])
        .select()
        .single();

      if (error) throw error;
      
      await loadOfficers();
      return data;
    } catch (error: any) {
      if (error.message.includes('duplicate key') || error.code === '23505') {
        toast.error('An officer with this email or mobile number already exists');
      } else {
        toast.error(`Failed to add officer: ${error.message}`);
      }
      throw error;
    }
  };

  const updateOfficer = async (id: string, updates: Partial<Officer>) => {
    try {
      // Fetch current officer data to check plan expiry
      const { data: currentOfficer, error: fetchError } = await supabase
        .from('officers')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const officerToUpdate = { ...currentOfficer, ...updates };

      // Check for plan expiry and apply credit reset logic
      if (officerToUpdate.plan_id) {
        const selectedPlan = ratePlans.find(plan => plan.id === officerToUpdate.plan_id);
        if (selectedPlan && selectedPlan.validity_days) {
          const planStartDate = new Date(officerToUpdate.registered_on);
          const planExpiryDate = addDays(planStartDate, selectedPlan.validity_days);

          if (isPast(planExpiryDate) && !selectedPlan.carry_forward_credits_on_renewal) {
            // Plan has expired and credits should not be carried forward
            officerToUpdate.credits_remaining = selectedPlan.default_credits;
            officerToUpdate.total_credits = selectedPlan.default_credits;
            officerToUpdate.registered_on = new Date().toISOString(); // Reset plan start date
            toast.info(`Officer ${officerToUpdate.name}'s plan expired. Credits reset to ${selectedPlan.default_credits}.`);
          }
        }
      }

      // Extract password and remove it from the updates object
      const { password, ...updatesWithoutPassword } = officerToUpdate as any;
      
      // Prepare the update data
      const updateData = { ...updatesWithoutPassword };
      
      // If password is being updated, hash it
      if (password && password.trim()) {
        updateData.password_hash = `$2b$10$${btoa(password).slice(0, 53)}`;
      }
      
      const { error } = await supabase
        .from('officers')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
      
      await loadOfficers();
      toast.success('Officer updated successfully!');
    } catch (error: any) {
      toast.error(`Failed to update officer: ${error.message}`);
      throw error;
    }
  };

  const deleteOfficer = async (id: string) => {
    try {
      const { error } = await supabase
        .from('officers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await loadOfficers();
      toast.success('Officer deleted successfully!');
    } catch (error: any) {
      toast.error(`Failed to delete officer: ${error.message}`);
      throw error;
    }
  };

  // CRUD Operations for Credit Transactions
  const addTransaction = async (transactionData: Omit<CreditTransaction, 'id' | 'created_at'>) => {
    try {
      // First, add the transaction
      const { data, error } = await supabase
        .from('credit_transactions')
        .insert([transactionData])
        .select()
        .single();

      if (error) throw error;

      // Then update officer credits
      const officer = officers.find(o => o.id === transactionData.officer_id);
      if (officer) {
        const creditChange = transactionData.action === 'Deduction' 
          ? -Math.abs(transactionData.credits)
          : Math.abs(transactionData.credits);

        const newCreditsRemaining = Math.max(0, officer.credits_remaining + creditChange);
        const newTotalCredits = ['Renewal', 'Top-up'].includes(transactionData.action)
          ? officer.total_credits + Math.abs(transactionData.credits)
          : officer.total_credits;

        await updateOfficer(transactionData.officer_id, {
          credits_remaining: newCreditsRemaining,
          total_credits: newTotalCredits
        });
      }

      await loadTransactions();
      return data;
    } catch (error: any) {
      toast.error(`Failed to add transaction: ${error.message}`);
      throw error;
    }
  };

  // Registration Management - FIXED: Removed automatic officer creation
  const updateRegistration = async (id: string, updates: Partial<OfficerRegistration>) => {
    try {
      const { error } = await supabase
        .from('officer_registrations')
        .update({
          ...updates,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      
      await loadRegistrations();
      
      // REMOVED: No longer automatically creating officer here
      // The officer creation is now handled explicitly in the approval flow
      
      toast.success(`Registration ${updates.status} successfully!`);
    } catch (error: any) {
      toast.error(`Failed to update registration: ${error.message}`);
      throw error;
    }
  };

  // Rate Plan Management
  const addRatePlan = async (planData: Omit<RatePlan, 'id' | 'created_at' | 'updated_at'>, apiSettings: any[]) => {
    try {
      // Create the rate plan
      const { data: plan, error: planError } = await supabase
        .from('rate_plans')
        .insert([planData])
        .select()
        .single();

      if (planError) throw planError;

      // Create plan-API relationships
      if (apiSettings.length > 0) {
        const planAPIData = apiSettings.map(api => ({
          plan_id: plan.id,
          api_id: api.id,
          enabled: api.enabled,
          credit_cost: api.credit_cost,
          buy_price: api.buy_price,
          sell_price: api.sell_price
        }));

        const { error: planAPIError } = await supabase
          .from('plan_apis')
          .insert(planAPIData);

        if (planAPIError) throw planAPIError;
      }

      await Promise.all([loadRatePlans(), loadPlanAPIs()]);
      toast.success('Rate plan created successfully!');
      return plan;
    } catch (error: any) {
      if (error.message.includes('duplicate key') || error.code === '23505') {
        toast.error('A rate plan with this name and user type already exists');
      } else {
        toast.error(`Failed to create rate plan: ${error.message}`);
      }
      throw error;
    }
  };

  const updateRatePlan = async (id: string, updates: Partial<RatePlan>, apiSettings?: any[]) => {
    try {
      const { error: planError } = await supabase
        .from('rate_plans')
        .update(updates)
        .eq('id', id);

      if (planError) throw planError;

      // Update API settings if provided
      if (apiSettings) {
        // Delete existing plan-API relationships
        const { error: deleteError } = await supabase
          .from('plan_apis')
          .delete()
          .eq('plan_id', id);

        if (deleteError) throw deleteError;

        // Insert new relationships
        if (apiSettings.length > 0) {
          const planAPIData = apiSettings.map(api => ({
            plan_id: id,
            api_id: api.api_id,
            enabled: api.enabled, // Ensure these are numbers
            credit_cost: api.credit_cost,
            buy_price: api.buy_price,
            sell_price: api.sell_price
          }));

          const { error: planAPIError } = await supabase
            .from('plan_apis')
            .insert(planAPIData);

          if (planAPIError) throw planAPIError;
        }
      }

      await Promise.all([loadRatePlans(), loadPlanAPIs()]);
      toast.success('Rate plan updated successfully!');
    } catch (error: any) {
      toast.error(`Failed to update rate plan: ${error.message}`);
      throw error;
    }
  };

  const deleteRatePlan = async (id: string) => {
    try {
      const { error } = await supabase
        .from('rate_plans')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await Promise.all([loadRatePlans(), loadPlanAPIs()]);
      toast.success('Rate plan deleted successfully!');
    } catch (error: any) {
      toast.error(`Failed to delete rate plan: ${error.message}`);
      throw error;
    }
  };

  // API Management
  const addAPI = async (apiData: Omit<API, 'id' | 'created_at' | 'updated_at' | 'usage_count' | 'last_used'>) => {
    try {
      const { data, error } = await supabase
        .from('apis')
        .insert([{
          ...apiData, // Ensure these are numbers
          usage_count: 0,
          key_status: apiData.key_status || 'Inactive'
        }])
        .select()
        .single();

      if (error) throw error;
      
      await loadAPIs();
      toast.success('API added successfully!');
      return data;
    } catch (error: any) {
      if (error.message.includes('duplicate key') || error.code === '23505') {
        toast.error('An API with this name already exists');
      } else {
        toast.error(`Failed to add API: ${error.message}`);
      }
      throw error;
    }
  };

  const updateAPI = async (id: string, updates: Partial<API>) => {
    try {
      const { error } = await supabase
        .from('apis')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      await loadAPIs();
      toast.success('API updated successfully!');
    } catch (error: any) {
      toast.error(`Failed to update API: ${error.message}`);
      throw error;
    }
  };

  const deleteAPI = async (id: string) => {
    try {
      const { error } = await supabase
        .from('apis')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await loadAPIs();
      toast.success('API deleted successfully!');
    } catch (error: any) {
      toast.error(`Failed to delete API: ${error.message}`);
      throw error;
    }
  };

  // Query Management
  const addQuery = async (queryData: Omit<Query, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('queries')
        .insert([queryData])
        .select()
        .single();

      if (error) throw error;
      
      await loadQueries();
      return data;
    } catch (error: any) {
      toast.error(`Failed to add query: ${error.message}`);
      throw error;
    }
  };

  // Manual Request Management
  const addManualRequest = async (requestData: Omit<ManualRequest, 'id' | 'status' | 'created_at' | 'approved_at' | 'admin_response' | 'credit_deducted' | 'approved_by' | 'officers'>) => {
    try {
      const { data, error } = await supabase
        .from('manual_requests')
        .insert([{ ...requestData, status: 'pending' }])
        .select()
        .single();

      if (error) throw error;
      
      await loadManualRequests();
      toast.success('Manual request submitted successfully!');
      return data;
    } catch (error: any) {
      toast.error(`Failed to submit manual request: ${error.message}`);
      throw error;
    }
  };

  const updateManualRequest = async (id: string, updates: Partial<ManualRequest>) => {
    try {
      // If request is approved, deduct credits from officer and log transaction
      if (updates.status === 'approved' && updates.credit_deducted !== undefined && updates.approved_by) {
        const currentRequest = manualRequests.find(req => req.id === id);
        const officer = officers.find(o => o.id === currentRequest?.officer_id);

        if (officer && updates.credit_deducted > 0) {
          const newCreditsRemaining = officer.credits_remaining - updates.credit_deducted;
          const newTotalQueries = officer.total_queries + 1; // Assuming one query per manual request approval

          await updateOfficer(officer.id, {
            credits_remaining: newCreditsRemaining,
            total_queries: newTotalQueries
          });

          await addTransaction({
            officer_id: officer.id,
            officer_name: officer.name,
            action: 'Deduction',
            credits: updates.credit_deducted,
            payment_mode: 'Manual Request',
            remarks: `Manual request approved: ${currentRequest?.input_type || 'N/A'} - ${currentRequest?.input_value || 'N/A'}`,
          });

          // Add notification for the officer
          addNotification({
            type: 'success',
            title: 'Manual Request Approved!',
            message: `Your request for "${currentRequest?.input_type}: ${currentRequest?.input_value}" has been approved. ${updates.credit_deducted} credits deducted. Admin response: "${updates.admin_response || 'N/A'}"`,
            link: `/officer/dashboard/history`, // Link to officer's history
          });

        }
      } else if (updates.status === 'rejected' && updates.approved_by) {
        const currentRequest = manualRequests.find(req => req.id === id);
        // Add notification for the officer
        addNotification({
          type: 'error',
          title: 'Manual Request Rejected!',
          message: `Your request for "${currentRequest?.input_type}: ${currentRequest?.input_value}" has been rejected. Admin response: "${updates.admin_response || 'N/A'}"`,
          link: `/officer/dashboard/history`, // Link to officer's history
        });
      }

      const { error } = await supabase
        .from('manual_requests')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      await loadManualRequests(); // Reload manual requests after update
      toast.success('Manual request updated successfully!');
    } catch (error: any) {
      toast.error(`Failed to update manual request: ${error.message}`);
      throw error;
    }
  };

  // Get officer's enabled APIs based on their rate plan
  const getOfficerEnabledAPIs = (officerId: string) => {
    const officer = officers.find(o => o.id === officerId);
    if (!officer || !officer.plan_id) return [];
    
    // Get plan APIs for this officer's plan
    const officerPlanAPIs = planAPIs.filter(pa => pa.plan_id === officer.plan_id && pa.enabled);
    
    // Return the actual API details with plan-specific pricing
    return officerPlanAPIs.map(planAPI => {
      const api = apis.find(a => a.id === planAPI.api_id);
      return {
        ...api,
        credit_cost: planAPI.credit_cost,
        buy_price: planAPI.buy_price,
        sell_price: planAPI.sell_price
      };
    }).filter(Boolean);
  };
  // Initialize data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Recalculate stats when data changes
  useEffect(() => {
    if (!isLoading) {
      calculateDashboardStats();
    }
  }, [officers, queries, transactions, apis, manualRequests, isLoading]); // Added manualRequests to dependency array

  return {
    // Data
    officers,
    transactions,
    queries,
    registrations,
    liveRequests,
    apis,
    ratePlans,
    planAPIs,
    manualRequests, // Expose manualRequests
    dashboardStats,
    isLoading,
    
    // Actions
    loadData,
    addOfficer,
    updateOfficer,
    deleteOfficer,
    addTransaction,
    addQuery,
    updateRegistration,
    addRatePlan,
    updateRatePlan,
    deleteRatePlan,
    addAPI,
    updateAPI,
    deleteAPI,
    addManualRequest, // Expose addManualRequest
    updateManualRequest, // Expose updateManualRequest
    getOfficerEnabledAPIs,
    
    // Setters for local updates
    setOfficers,
    setTransactions,
    setQueries,
    setRegistrations,
    setLiveRequests,
    setAPIs,
    setRatePlans,
    setPlanAPIs,
    setManualRequests // Expose setter for manualRequests
  };
};
