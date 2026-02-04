# Module 12: Help & Support

## Description
Import the help page with documentation, FAQ, and AI chatbot assistant.

## Scope
- Help documentation/FAQ
- Search functionality
- Contact support form
- AI Chatbot interface

## Dependencies
- Module 02 (Layout)
- Module 01 (UI Components)

## Clarifying Questions

### Q1: AI Chatbot
Lovable includes an AI chatbot component. Implementation options:
- **A)** Integrate with OpenAI/Claude API
- **B)** Use a third-party chatbot service
- **C)** Simple FAQ bot with predefined answers
- **D)** Skip chatbot, keep help page only

### Q2: Documentation Source
- **A)** Static markdown files
- **B)** CMS-managed content
- **C)** External docs site (link out)
- **D)** Inline documentation only

### Q3: Support Tickets
- **A)** Email-based support (contact form)
- **B)** Integrated ticket system
- **C)** Third-party (Zendesk, Intercom, etc.)
- **D)** No support tickets, just docs

### Q4: Help Content
- **A)** Import Lovable's help structure
- **B)** Create custom help content
- **C)** Placeholder content for now

## Source Files (Lovable)
- `pages/Help.tsx` (8.5KB)
- `components/HelpChatbot.tsx` (13.8KB)

## API Endpoints to Create
- `GET /api/help/articles` - List help articles
- `GET /api/help/search` - Search articles
- `POST /api/help/contact` - Submit contact form
- `POST /api/chat` - AI chat endpoint (if using)

## Target Files
- `resources/js/pages/help.tsx`
- `resources/js/components/help/help-search.tsx`
- `resources/js/components/help/help-article.tsx`
- `resources/js/components/help/chatbot.tsx`
- `resources/js/components/help/contact-form.tsx`
