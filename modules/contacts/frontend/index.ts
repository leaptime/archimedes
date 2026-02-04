// Contacts Module Frontend Entry Point
// This file registers all views, widgets, and extensions from the contacts module

// Views
export { ContactForm } from './views/ContactForm';

// Components
export { ContactList } from './components/ContactList';
export { ContactFilters, defaultFilters } from './components/ContactFilters';
export { AddressManager } from './components/AddressManager';
export { BankAccountManager } from './components/BankAccountManager';

// Types
export type { ContactListItem } from './components/ContactList';
export type { ContactFiltersState } from './components/ContactFilters';
export type { Address } from './components/AddressManager';
export type { BankAccount } from './components/BankAccountManager';

// Import views to trigger registration
import './views/ContactForm';

console.log('[Contacts Module] Frontend components loaded');
