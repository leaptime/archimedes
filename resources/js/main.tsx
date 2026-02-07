import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { ThemeProvider } from '@/hooks/use-theme';
import { initializeTheme } from '@/hooks/use-appearance';
import { PermissionProvider } from '@/hooks/use-permissions';
import { AuthProvider } from '@/contexts/auth-context';
// Unified extension system
import { UnifiedExtensionProvider } from '@/lib/extensions';

// Register bundled extension components
import '@/extensions';
import '../css/app.css';

// Auth pages
import Login from '@/pages/auth/login';
import Register from '@/pages/auth/register';
import ForgotPassword from '@/pages/auth/forgot-password';
import ResetPassword from '@/pages/auth/reset-password';
import TwoFactorChallenge from '@/pages/auth/two-factor-challenge';

// App pages
import Dashboard from '@/pages/dashboard';
import Marketplace from '@/pages/marketplace';
import MyModules from '@/pages/my-modules';
import Analytics from '@/pages/analytics';
import Wizard from '@/pages/wizard';
import Upgrades from '@/pages/upgrades';
import Team from '@/pages/team';
import Settings from '@/pages/settings';
import Help from '@/pages/help';
import Management from '@/pages/management';
import Contacts from '@/pages/contacts';
import ContactDetail from '@/pages/contact-detail';
import ModuleDetail from '@/pages/module-detail';
import ContactView from '@/pages/contact-view';
import Permissions from '@/pages/permissions';
import CompanySettings from '@/pages/company-settings';
import Banking from '@/pages/banking';
import BankingCallback from '@/pages/banking/callback';
import Invoices from '@/pages/invoices';
import InvoiceDetail from '@/pages/invoice-detail';
import InvoiceForm from '@/pages/invoice-form';
import CashBook from '@/pages/cashbook';
import CashBookDetail from '@/pages/cashbook-detail';
import CashBookForm from '@/pages/cashbook-form';
import CrmPipeline from '@/pages/crm-pipeline';
import CrmLeads from '@/pages/crm-leads';
import CrmLeadDetail from '@/pages/crm-lead-detail';
import CrmLeadForm from '@/pages/crm-lead-form';
import Documentation from '@/pages/documentation';
import NotFound from '@/pages/not-found';

// Partner Portal pages
import PartnerDashboard from '@/pages/partner/dashboard';
import PartnerOrganizations from '@/pages/partner/organizations';
import PartnerOrganizationDetail from '@/pages/partner/organization-detail';
import PartnerOrganizationForm from '@/pages/partner/organization-form';
import PartnerRevenue from '@/pages/partner/revenue';
import PartnerSettings from '@/pages/partner/settings';

// Platform Admin pages
import PlatformDashboard from '@/pages/platform/dashboard';
import PlatformPartners from '@/pages/platform/partners';
import PlatformPartnerDetail from '@/pages/platform/partner-detail';
import PlatformPartnerForm from '@/pages/platform/partner-form';
import PlatformOrganizations from '@/pages/platform/organizations';

// Initialize theme
initializeTheme();

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <ThemeProvider>
                    <PermissionProvider>
                        <UnifiedExtensionProvider>
                        <BrowserRouter>
                    <Routes>
                        {/* Auth routes */}
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/reset-password/:token" element={<ResetPassword />} />
                        <Route path="/two-factor-challenge" element={<TwoFactorChallenge />} />

                        {/* App routes */}
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/marketplace" element={<Marketplace />} />
                        <Route path="/my-modules" element={<MyModules />} />
                        <Route path="/modules/:moduleId" element={<ModuleDetail />} />
                        <Route path="/analytics" element={<Analytics />} />
                        <Route path="/wizard" element={<Wizard />} />
                        <Route path="/upgrades" element={<Upgrades />} />
                        <Route path="/team" element={<Team />} />
                        <Route path="/management" element={<Management />} />
                        <Route path="/management/*" element={<Management />} />
                        <Route path="/contacts" element={<Contacts />} />
                        <Route path="/contacts/view" element={<ContactView />} />
                        <Route path="/contacts/:id" element={<ContactDetail />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/settings/*" element={<Settings />} />
                        <Route path="/management/permissions" element={<Permissions />} />
                        <Route path="/company-settings" element={<CompanySettings />} />
                        <Route path="/banking" element={<Banking />} />
                        <Route path="/banking/callback" element={<BankingCallback />} />
                        <Route path="/invoices" element={<Invoices />} />
                        <Route path="/invoices/new" element={<InvoiceForm />} />
                        <Route path="/invoices/:id" element={<InvoiceDetail />} />
                        <Route path="/invoices/:id/edit" element={<InvoiceForm />} />
                        <Route path="/cashbook" element={<CashBook />} />
                        <Route path="/cashbook/new" element={<CashBookForm />} />
                        <Route path="/cashbook/:id" element={<CashBookDetail />} />
                        <Route path="/cashbook/:id/edit" element={<CashBookForm />} />
                        <Route path="/crm" element={<CrmPipeline />} />
                        <Route path="/crm/leads" element={<CrmLeads />} />
                        <Route path="/crm/leads/new" element={<CrmLeadForm />} />
                        <Route path="/crm/leads/:id" element={<CrmLeadDetail />} />
                        <Route path="/crm/leads/:id/edit" element={<CrmLeadForm />} />
                        <Route path="/documentation" element={<Documentation />} />
                        <Route path="/help" element={<Help />} />

                        {/* Partner Portal Routes */}
                        <Route path="/partner" element={<PartnerDashboard />} />
                        <Route path="/partner/dashboard" element={<PartnerDashboard />} />
                        <Route path="/partner/organizations" element={<PartnerOrganizations />} />
                        <Route path="/partner/organizations/new" element={<PartnerOrganizationForm />} />
                        <Route path="/partner/organizations/:id" element={<PartnerOrganizationDetail />} />
                        <Route path="/partner/organizations/:id/edit" element={<PartnerOrganizationForm />} />
                        <Route path="/partner/revenue" element={<PartnerRevenue />} />
                        <Route path="/partner/settings" element={<PartnerSettings />} />

                        {/* Platform Admin Routes */}
                        <Route path="/platform" element={<PlatformDashboard />} />
                        <Route path="/platform/dashboard" element={<PlatformDashboard />} />
                        <Route path="/platform/partners" element={<PlatformPartners />} />
                        <Route path="/platform/partners/new" element={<PlatformPartnerForm />} />
                        <Route path="/platform/partners/:id" element={<PlatformPartnerDetail />} />
                        <Route path="/platform/partners/:id/edit" element={<PlatformPartnerForm />} />
                        <Route path="/platform/organizations" element={<PlatformOrganizations />} />
                        <Route path="/platform/organizations/new" element={<PlatformPartnerForm />} />
                        <Route path="/platform/organizations/:id" element={<PlatformPartnerDetail />} />

                            {/* Redirects */}
                            <Route path="/" element={<Navigate to="/dashboard" replace />} />
                            <Route path="*" element={<NotFound />} />
                        </Routes>
                    </BrowserRouter>
                        </UnifiedExtensionProvider>
                    </PermissionProvider>
                </ThemeProvider>
            </AuthProvider>
        </QueryClientProvider>
    );
}

const container = document.getElementById('app');
if (container) {
    createRoot(container).render(
        <StrictMode>
            <App />
        </StrictMode>
    );
}
