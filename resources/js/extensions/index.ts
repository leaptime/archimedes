/**
 * Plugin Components Registration
 * 
 * This file registers all bundled plugin components.
 * Plugins that are included in the main bundle should register their
 * components here so they can be loaded dynamically.
 * 
 * For SaaS deployments, plugins are loaded dynamically via API.
 * For self-hosted deployments, plugins can be bundled and registered here.
 */

import { registerExtensionComponent } from '@/lib/extensions';

// Import plugin components
// These are the bundled plugins included with the platform

// Contact Social Links (Community L1)
import SocialLinksFormSection from '@plugins/contact-social-links/frontend/SocialLinksFormSection';
import SocialLinksDetailSection from '@plugins/contact-social-links/frontend/SocialLinksDetailSection';

// Contact CRM Scoring (Verified L2)
import CrmScoringFormSection from '@plugins/contact-crm-scoring/frontend/CrmScoringFormSection';
import CrmScoringCard from '@plugins/contact-crm-scoring/frontend/CrmScoringCard';

// Contact Activities (Certified L3)
import ActivitiesTab from '@plugins/contact-activities/frontend/ActivitiesTab';

/**
 * Register all bundled plugin components
 */
export function registerBundledPlugins() {
    // Contact Social Links
    registerExtensionComponent(
        'contact-social-links',
        'frontend/SocialLinksFormSection.tsx',
        SocialLinksFormSection
    );
    registerExtensionComponent(
        'contact-social-links',
        'frontend/SocialLinksDetailSection.tsx',
        SocialLinksDetailSection
    );

    // Contact CRM Scoring
    registerExtensionComponent(
        'contact-crm-scoring',
        'frontend/CrmScoringFormSection.tsx',
        CrmScoringFormSection
    );
    registerExtensionComponent(
        'contact-crm-scoring',
        'frontend/CrmScoringCard.tsx',
        CrmScoringCard
    );

    // Contact Activities
    registerExtensionComponent(
        'contact-activities',
        'frontend/ActivitiesTab.tsx',
        ActivitiesTab
    );

    console.log('[Plugins] Registered bundled plugin components');
}

// Auto-register on import
registerBundledPlugins();
