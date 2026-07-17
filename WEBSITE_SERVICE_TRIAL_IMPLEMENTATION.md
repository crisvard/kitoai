# Website Service - Trial Implementation (7 Days)

## 📋 Summary

O Website Service agora possui um sistema de teste grátis de **7 dias corridos**, idêntico ao sistema de trial do WhatsApp Agendamentos, mas com duração de 7 dias em vez de 3 dias.

## 🎯 What Was Implemented

### 1. **Database Changes**
- **File**: `add_website_trial_fields.sql`
- **Fields Added to `profiles` table**:
  - `trial_website_active` (BOOLEAN) - Marca se o trial de website está ativo
  - `trial_website_end_date` (TIMESTAMP) - Data/hora de expiração do trial
- **Indexes**: Ambos os campos têm índices para performance

### 2. **UI Components**

#### **TrialWebsitePage.tsx**
- **Path**: `/trial-website`
- **Purpose**: Landing page do trial de 7 dias
- **Features**:
  - Exibe benefícios do serviço
  - Mostra período exato de teste (7 dias)
  - Botão "Começar Teste de 7 Dias" que:
    1. Define `trial_website_active = true`
    2. Calcula data de fim (hoje + 7 dias)
    3. Define `website_active = true` para liberar acesso
    4. Redireciona para dashboard com `?from_trial=true&service=website`

#### **Dashboard.tsx (Updated)**
- **Trial Banner**: 
  - Exibe mensagem azul quando trial de website está ativo
  - Mostra data de expiração
  - Message: "7 dias de teste grátis"
  
- **Plan Visibility**:
  - Plan "Desenvolvimento de Sites" (id: '4') fica oculto quando `trial_website_active = true`
  - Impede que usuário contrate o plano durante o trial
  
- **Button Logic**:
  - Quando clica no plan "Desenvolvimento de Sites", redireciona para `/trial-website`
  - Button text: "Testar 7 dias Grátis"

### 3. **Routing**

#### **App.tsx (Updated)**
- **New Import**: `import TrialWebsitePage from './pages/TrialWebsitePage'`
- **New Route**: `/trial-website`
- **Wrapper**: `TrialWebsitePageWrapper()` component

## 🔄 Trial Flow

```
1. User clicks "Testar 7 dias Grátis" on Website Service plan
       ↓
2. Navigates to /trial-website (TrialWebsitePage)
       ↓
3. User sees trial details and clicks "Começar Teste de 7 Dias"
       ↓
4. API call updates profiles table:
   - trial_website_active = true
   - trial_website_end_date = current_date + 7 days
   - website_active = true (unlocks feature)
       ↓
5. Clear localStorage cache
       ↓
6. Redirect to /dashboard?from_trial=true&service=website
       ↓
7. Dashboard displays:
   - Trial banner (blue) showing expiration date
   - Website Service plan is hidden (while trial active)
   - Website Service available in navbar/navigation
```

## 📊 Comparison: WhatsApp Trial vs Website Trial

| Feature | WhatsApp Trial | Website Trial |
|---------|---|---|
| Duration | 3 days | 7 days |
| Field Prefix | `trial_` | `trial_website_` |
| Plan ID | '3' | '4' |
| Page URL | `/trial-confirmation` | `/trial-website` |
| Banner Color | Yellow | Blue |
| Calculation | `Date.getDate() + 3` | `Date.getDate() + 7` |

## 🗄️ Database Schema

```sql
-- Profiles table extensions
trial_website_active BOOLEAN DEFAULT false
trial_website_end_date TIMESTAMP

-- Indexes for performance
CREATE INDEX idx_profiles_trial_website_active ON profiles(trial_website_active);
CREATE INDEX idx_profiles_trial_website_end_date ON profiles(trial_website_end_date);
```

## 🔐 RLS Policies

The existing RLS policies for the `profiles` table automatically secure these new fields:
- Users can only read/write their own `trial_website_active` and `trial_website_end_date` fields
- The RLS policy uses `auth.uid() = user_id` check

## 🚀 Usage Instructions

### For Users:
1. Go to Dashboard
2. Find "Desenvolvimento de Sites" plan card
3. Click "Testar 7 dias Grátis" button
4. Review trial details on the page
5. Click "Começar Teste de 7 Dias"
6. Get instant access to Website Service
7. See trial expiration date in the dashboard banner

### For Developers:
1. Ensure SQL migrations are applied (run `add_website_trial_fields.sql`)
2. TrialWebsitePage.tsx handles all trial logic
3. Dashboard.tsx displays trial status and filters plans
4. App.tsx handles routing to trial page
5. useUserProfile hook provides `profile.trial_website_active` and `profile.trial_website_end_date`

## 📝 Files Modified/Created

### Created:
- `src/pages/TrialWebsitePage.tsx` (NEW)
- `add_website_trial_fields.sql` (NEW)

### Modified:
- `src/App.tsx` - Added import, route, and wrapper
- `src/components/Dashboard.tsx` - Added trial banner, plan filtering, button routing

## 🔍 Troubleshooting

### Trial not activating?
1. Check if SQL migrations were applied to profiles table
2. Verify user is logged in
3. Check browser console for API errors
4. Clear localStorage cache manually

### Trial banner not showing?
1. Verify `profile?.trial_website_active` is true
2. Check if `trial_website_end_date` is calculated correctly
3. Ensure useUserProfile hook is fetching latest profile data

### Can't navigate to /trial-website?
1. Verify TrialWebsitePage.tsx file exists in `/src/pages/`
2. Check if import is correct in App.tsx
3. Ensure route is defined in createBrowserRouter config
4. Check browser console for routing errors

## 📞 Support

For questions about trial implementation, refer to:
- `/pages/TrialConfirmationPage.tsx` - WhatsApp trial reference
- `/components/Dashboard.tsx` - Plan filtering and banner logic
- `/hooks/useUserProfile.ts` - Profile data fetching

## ✅ Verification Checklist

- [x] SQL migration file created (`add_website_trial_fields.sql`)
- [x] TrialWebsitePage.tsx component created
- [x] Route `/trial-website` added to App.tsx
- [x] Import statement added to App.tsx
- [x] Wrapper component created
- [x] Dashboard updated with trial banner
- [x] Dashboard plan filtering updated
- [x] Dashboard button routing updated
- [ ] SQL migrations executed in Supabase (NEXT STEP)
- [ ] Test trial flow end-to-end (NEXT STEP)
