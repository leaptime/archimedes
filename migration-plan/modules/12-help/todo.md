# Help & Support - TODO

## Backend Setup
- [ ] Create help_articles table (if storing in DB)
- [ ] Create `HelpController`
- [ ] Implement `GET /api/help/articles`
- [ ] Implement `GET /api/help/search`
- [ ] Implement `POST /api/help/contact`
- [ ] Set up email notification for contact form

## AI Chatbot (if implementing)
- [ ] Set up OpenAI/Claude API integration
- [ ] Create `ChatController`
- [ ] Implement `POST /api/chat`
- [ ] Add rate limiting
- [ ] Store chat history (optional)

## Page Implementation
- [ ] Create `pages/help.tsx`
- [ ] Add page header
- [ ] Layout with sidebar navigation

## Help Content Sections
- [ ] Getting Started guide
- [ ] Module documentation
- [ ] API reference (if applicable)
- [ ] FAQs section
- [ ] Troubleshooting guide

## Search Functionality
- [ ] Create `HelpSearch` component
- [ ] Implement search input with debounce
- [ ] Display search results
- [ ] Highlight matching terms
- [ ] Handle no results state

## Article Display
- [ ] Create `HelpArticle` component
- [ ] Render markdown content
- [ ] Add table of contents
- [ ] Add prev/next navigation
- [ ] Add "Was this helpful?" feedback

## Chatbot Interface
- [ ] Create `Chatbot` component
- [ ] Message input field
- [ ] Message history display
- [ ] Typing indicator
- [ ] Handle API errors gracefully
- [ ] Suggested questions
- [ ] Clear chat button

## Contact Form
- [ ] Create `ContactForm` component
- [ ] Subject dropdown
- [ ] Message textarea
- [ ] File attachment (optional)
- [ ] Submit button with loading
- [ ] Success confirmation

## Data Fetching
- [ ] Create `useHelpArticles` hook
- [ ] Create `useSearchHelp` hook
- [ ] Create `useSendMessage` mutation (chat)
- [ ] Create `useContactSupport` mutation

## Testing
- [ ] Test article display
- [ ] Test search functionality
- [ ] Test contact form submission
- [ ] Test chatbot (if implemented)
- [ ] Test mobile layout
