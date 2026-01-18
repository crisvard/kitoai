import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

serve(async (req) => {
  console.log('🚀 [APPOINTMENT TOOLS] Starting appointment tools...')

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get user from JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Get user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      throw new Error('Invalid user')
    }

    console.log('👤 [APPOINTMENT TOOLS] User:', user.id)

    // Get request body
    const body = await req.json()
    const { action, data } = body

    console.log('📋 [APPOINTMENT TOOLS] Action:', action, 'Data:', data)

    let result

    switch (action) {
      case 'get_appointments':
        result = await getAppointments(supabaseClient, user.id, data)
        break

      case 'create_appointment':
        result = await createAppointment(supabaseClient, user.id, data)
        break

      case 'reschedule_appointment':
        result = await rescheduleAppointment(supabaseClient, user.id, data)
        break

      case 'cancel_appointment':
        result = await cancelAppointment(supabaseClient, user.id, data)
        break

      case 'get_available_slots':
        result = await getAvailableSlots(supabaseClient, user.id, data)
        break

      case 'get_professionals':
        result = await getProfessionals(supabaseClient, user.id)
        break

      case 'get_services':
        result = await getServices(supabaseClient, user.id)
        break

      default:
        throw new Error(`Unknown action: ${action}`)
    }

    console.log('✅ [APPOINTMENT TOOLS] Action completed successfully')

    return new Response(
      JSON.stringify({
        success: true,
        data: result
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('💥 [APPOINTMENT TOOLS] Fatal error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Failed to execute appointment tool'

    return new Response(
      JSON.stringify({
        success: false,
        message: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})

// Helper functions for appointment operations

async function getAppointments(supabaseClient: any, userId: string, filters: any = {}) {
  console.log('📅 [GET APPOINTMENTS] Getting appointments with filters:', filters)

  let query = supabaseClient
    .from('appointments')
    .select(`
      *,
      appointment_services (
        id,
        service_id,
        professional_id,
        price,
        duration_minutes,
        services (
          id,
          name,
          description,
          duration_minutes,
          price
        ),
        professionals (
          id,
          name,
          specialty
        )
      ),
      customers (
        id,
        name,
        phone,
        email
      )
    `)
    .eq('user_id', userId)

  // Apply filters
  if (filters.customer_phone) {
    // Find customer by phone first
    const { data: customer } = await supabaseClient
      .from('customers')
      .select('id')
      .eq('phone', filters.customer_phone)
      .eq('user_id', userId)
      .single()

    if (customer) {
      query = query.eq('customer_id', customer.id)
    }
  }

  if (filters.date) {
    query = query.eq('appointment_date', filters.date)
  }

  if (filters.status) {
    query = query.eq('status', filters.status)
  }

  if (filters.professional_id) {
    query = query.eq('professional_id', filters.professional_id)
  }

  // Order by date and time
  query = query.order('appointment_date', { ascending: true })
    .order('start_time', { ascending: true })

  // Limit results
  if (filters.limit) {
    query = query.limit(filters.limit)
  } else {
    query = query.limit(50) // Default limit
  }

  const { data, error } = await query

  if (error) {
    console.error('❌ [GET APPOINTMENTS] Error:', error)
    throw new Error(`Failed to get appointments: ${error.message}`)
  }

  console.log(`✅ [GET APPOINTMENTS] Found ${data?.length || 0} appointments`)
  return data || []
}

async function createAppointment(supabaseClient: any, userId: string, appointmentData: any) {
  console.log('📅 [CREATE APPOINTMENT] Creating appointment:', appointmentData)

  const {
    customer_phone,
    customer_name,
    customer_email,
    appointment_date,
    start_time,
    end_time,
    professional_id,
    services,
    notes
  } = appointmentData

  // Validate required fields
  if (!customer_phone || !appointment_date || !start_time || !services || services.length === 0) {
    throw new Error('Missing required fields: customer_phone, appointment_date, start_time, services')
  }

  // Find or create customer
  let customerId
  const { data: existingCustomer } = await supabaseClient
    .from('customers')
    .select('id')
    .eq('phone', customer_phone)
    .eq('user_id', userId)
    .single()

  if (existingCustomer) {
    customerId = existingCustomer.id
    // Update customer info if name/email provided
    if (customer_name || customer_email) {
      await supabaseClient
        .from('customers')
        .update({
          name: customer_name || null,
          email: customer_email || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', customerId)
    }
  } else {
    // Create new customer
    const { data: newCustomer, error: customerError } = await supabaseClient
      .from('customers')
      .insert({
        user_id: userId,
        name: customer_name || null,
        phone: customer_phone,
        email: customer_email || null
      })
      .select('id')
      .single()

    if (customerError) {
      throw new Error(`Failed to create customer: ${customerError.message}`)
    }
    customerId = newCustomer.id
  }

  // Create appointment
  const { data: appointment, error: appointmentError } = await supabaseClient
    .from('appointments')
    .insert({
      user_id: userId,
      customer_id: customerId,
      professional_id: professional_id || null,
      appointment_date: appointment_date,
      start_time: start_time,
      end_time: end_time || null,
      status: 'scheduled',
      notes: notes || null,
      total_price: 0, // Will be calculated from services
      created_at: new Date().toISOString()
    })
    .select('id')
    .single()

  if (appointmentError) {
    throw new Error(`Failed to create appointment: ${appointmentError.message}`)
  }

  // Add services to appointment
  const appointmentServices = services.map((service: any) => ({
    appointment_id: appointment.id,
    service_id: service.service_id,
    professional_id: service.professional_id || professional_id || null,
    price: service.price,
    duration_minutes: service.duration_minutes
  }))

  const { error: servicesError } = await supabaseClient
    .from('appointment_services')
    .insert(appointmentServices)

  if (servicesError) {
    // Clean up appointment if services insertion failed
    await supabaseClient.from('appointments').delete().eq('id', appointment.id)
    throw new Error(`Failed to add services to appointment: ${servicesError.message}`)
  }

  // Calculate total price
  const totalPrice = services.reduce((sum: number, service: any) => sum + (service.price || 0), 0)
  await supabaseClient
    .from('appointments')
    .update({ total_price: totalPrice })
    .eq('id', appointment.id)

  console.log('✅ [CREATE APPOINTMENT] Appointment created successfully:', appointment.id)
  return { appointment_id: appointment.id, customer_id: customerId, total_price: totalPrice }
}

async function rescheduleAppointment(supabaseClient: any, userId: string, rescheduleData: any) {
  console.log('📅 [RESCHEDULE APPOINTMENT] Rescheduling:', rescheduleData)

  const { appointment_id, new_date, new_start_time, new_end_time, reason } = rescheduleData

  if (!appointment_id || !new_date || !new_start_time) {
    throw new Error('Missing required fields: appointment_id, new_date, new_start_time')
  }

  // Update appointment
  const updateData: any = {
    appointment_date: new_date,
    start_time: new_start_time,
    updated_at: new Date().toISOString()
  }

  if (new_end_time) {
    updateData.end_time = new_end_time
  }

  if (reason) {
    updateData.notes = reason
  }

  const { error } = await supabaseClient
    .from('appointments')
    .update(updateData)
    .eq('id', appointment_id)
    .eq('user_id', userId)

  if (error) {
    throw new Error(`Failed to reschedule appointment: ${error.message}`)
  }

  console.log('✅ [RESCHEDULE APPOINTMENT] Appointment rescheduled successfully')
  return { success: true, appointment_id }
}

async function cancelAppointment(supabaseClient: any, userId: string, cancelData: any) {
  console.log('📅 [CANCEL APPOINTMENT] Cancelling:', cancelData)

  const { appointment_id, reason } = cancelData

  if (!appointment_id) {
    throw new Error('Missing required field: appointment_id')
  }

  const updateData: any = {
    status: 'cancelled',
    updated_at: new Date().toISOString()
  }

  if (reason) {
    updateData.notes = reason
  }

  const { error } = await supabaseClient
    .from('appointments')
    .update(updateData)
    .eq('id', appointment_id)
    .eq('user_id', userId)

  if (error) {
    throw new Error(`Failed to cancel appointment: ${error.message}`)
  }

  console.log('✅ [CANCEL APPOINTMENT] Appointment cancelled successfully')
  return { success: true, appointment_id }
}

async function getAvailableSlots(supabaseClient: any, userId: string, slotData: any) {
  console.log('📅 [GET AVAILABLE SLOTS] Getting slots for:', slotData)

  const { date, professional_id, duration_minutes } = slotData

  if (!date) {
    throw new Error('Missing required field: date')
  }

  // Get working hours for the professional or default
  let workingHours
  if (professional_id) {
    const { data } = await supabaseClient
      .from('working_hours')
      .select('*')
      .eq('professional_id', professional_id)
      .eq('day_of_week', new Date(date).getDay())
      .single()

    workingHours = data
  }

  // Default working hours if none found
  if (!workingHours) {
    workingHours = {
      start_time: '09:00',
      end_time: '18:00'
    }
  }

  // Get existing appointments for the date
  const { data: existingAppointments } = await supabaseClient
    .from('appointments')
    .select('start_time, end_time')
    .eq('appointment_date', date)
    .eq('status', 'scheduled')
    .eq('user_id', userId)
    .not('start_time', 'is', null)

  // Generate available time slots (30-minute intervals)
  const slots = []
  const startTime = new Date(`${date}T${workingHours.start_time}`)
  const endTime = new Date(`${date}T${workingHours.end_time}`)
  const slotDuration = duration_minutes || 60 // Default 1 hour

  let currentTime = new Date(startTime)

  while (currentTime < endTime) {
    const slotEnd = new Date(currentTime.getTime() + slotDuration * 60000)

    // Check if slot conflicts with existing appointments
    const conflict = existingAppointments?.some((apt: any) => {
      const aptStart = new Date(`${date}T${apt.start_time}`)
      const aptEnd = new Date(`${date}T${apt.end_time || apt.start_time}`)
      return (currentTime < aptEnd && slotEnd > aptStart)
    })

    if (!conflict && slotEnd <= endTime) {
      slots.push({
        start_time: currentTime.toTimeString().slice(0, 5),
        end_time: slotEnd.toTimeString().slice(0, 5),
        available: true
      })
    }

    currentTime = new Date(currentTime.getTime() + 30 * 60000) // 30-minute intervals
  }

  console.log(`✅ [GET AVAILABLE SLOTS] Found ${slots.length} available slots`)
  return slots
}

async function getProfessionals(supabaseClient: any, userId: string) {
  console.log('👥 [GET PROFESSIONALS] Getting professionals for user:', userId)

  const { data, error } = await supabaseClient
    .from('professionals')
    .select('id, name, specialty, phone, email')
    .eq('user_id', userId)
    .eq('active', true)
    .order('name')

  if (error) {
    throw new Error(`Failed to get professionals: ${error.message}`)
  }

  console.log(`✅ [GET PROFESSIONALS] Found ${data?.length || 0} professionals`)
  return data || []
}

async function getServices(supabaseClient: any, userId: string) {
  console.log('🛠️ [GET SERVICES] Getting services for user:', userId)

  const { data, error } = await supabaseClient
    .from('services')
    .select('id, name, description, duration_minutes, price, category')
    .eq('user_id', userId)
    .eq('active', true)
    .order('name')

  if (error) {
    throw new Error(`Failed to get services: ${error.message}`)
  }

  console.log(`✅ [GET SERVICES] Found ${data?.length || 0} services`)
  return data || []
}