import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface SetupStatus {
  credentialsSaved: boolean;
  wahaConnected: boolean;
  n8nWorkflowCreated: boolean;
  webhookValidated: boolean;
  agentConfigured: boolean;
}


export interface WhatsAppSession {
  sessionName: string;
  status: string;
  qrCode?: string;
}

export interface N8NWorkflow {
  workflowId: string;
  webhookUrl: string;
}

export const useWhatsAppSetup = () => {
  const [setupStatus, setSetupStatus] = useState<SetupStatus>({
    credentialsSaved: false,
    wahaConnected: false,
    n8nWorkflowCreated: false,
    webhookValidated: false,
    agentConfigured: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load current setup status
  useEffect(() => {
    loadSetupStatus();
  }, []);

  const loadSetupStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check WhatsApp session
      const { data: session } = await supabase
        .from('whatsapp_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'WORKING')
        .single();

      // Check N8N workflow - aceitar qualquer status (created, validated, active)
      const { data: workflow } = await supabase
        .from('n8n_workflows')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['created', 'validated', 'active'])
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      // Check agent config
      const { data: agentConfig } = await supabase
        .from('agent_configs')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setSetupStatus({
        credentialsSaved: true, // Credenciais globais sempre disponíveis
        wahaConnected: !!session,
        n8nWorkflowCreated: !!workflow, // True se existe workflow (qualquer status)
        webhookValidated: workflow?.status === 'validated' || workflow?.status === 'active' || session?.webhook_configured || false,
        agentConfigured: !!agentConfig,
      });

    } catch (err) {
      console.error('Error loading setup status:', err);
    }
  };


  // Test WAHA connection
  const testWAHAConnection = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('test-waha-connection');

      if (error) throw error;

      return data;
    } catch (err: any) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Create WAHA session
  const createWAHASession = async (sessionName: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('create-waha-session', {
        body: { sessionName }
      });

      if (error) throw error;

      if (data.success) {
        setSetupStatus(prev => ({ ...prev, wahaConnected: true }));
      }

      return data;
    } catch (err: any) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Create N8N workflow
  const createN8NWorkflow = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('create-n8n-workflow');

      if (error) throw error;

      if (data.success) {
        setSetupStatus(prev => ({ ...prev, n8nWorkflowCreated: true }));
      }

      return data;
    } catch (err: any) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Validate N8N workflow (customize webhook and activate)
  const validateN8NWorkflow = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('validate-n8n-workflow');

      if (error) throw error;

      if (data.success) {
        setSetupStatus(prev => ({ ...prev, webhookValidated: true }));
      }

      return data;
    } catch (err: any) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Health check for all dependencies
  const runHealthCheck = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('health-check');

      if (error) throw error;

      return data;
    } catch (err: any) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Disconnect WhatsApp and clean up all dependent data
  const disconnectWhatsApp = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('disconnect-whatsapp');

      if (error) throw error;

      if (data.success) {
        // Reset all setup status
        setSetupStatus({
          credentialsSaved: true, // Keep credentials
          wahaConnected: false,
          n8nWorkflowCreated: false,
          webhookValidated: false,
          agentConfigured: false,
        });
      }

      return data;
    } catch (err: any) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Validate webhook
  const validateWebhook = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('validate-webhook');

      if (error) throw error;

      if (data.success) {
        setSetupStatus(prev => ({ ...prev, webhookValidated: true }));
      }

      return data;
    } catch (err: any) {
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Save agent configuration
  const saveAgentConfig = async (config: any) => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('agent_configs')
        .upsert({
          user_id: user.id,
          ...config,
        });

      if (error) throw error;

      setSetupStatus(prev => ({ ...prev, agentConfigured: true }));
      return { success: true };

    } catch (err: any) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    setupStatus,
    loading,
    error,
    testWAHAConnection,
    createWAHASession,
    createN8NWorkflow,
    validateN8NWorkflow,
    validateWebhook,
    saveAgentConfig,
    runHealthCheck,
    disconnectWhatsApp,
    refreshStatus: loadSetupStatus,
  };
};