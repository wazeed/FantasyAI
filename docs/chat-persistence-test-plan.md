# Chat Persistence Manual Test Plan

## Guest User Flow Tests

### Test Case G1: New Guest Conversation
1. Launch app and skip login
2. Select a character to chat with
3. Send a test message
4. Verify message appears in chat
5. Close the app completely
6. Relaunch app and go to Chats tab
7. Verify previous conversation is listed
8. Open conversation and verify message history is present

### Test Case G2: Guest Message Limits
1. Start new conversation as guest
2. Send multiple messages until reaching limit
3. Verify subscription offer appears
4. Verify can't send more messages after limit
5. Verify limit persists across app restarts

### Test Case G3: Multiple Guest Conversations
1. Start conversations with 3 different characters
2. Send messages in each conversation
3. Verify all conversations appear in Chats tab
4. Verify each conversation maintains correct history
5. Verify conversations persist after app restart

## Authenticated User Flow Tests

### Test Case A1: New Authenticated Conversation
1. Login to app
2. Start new conversation
3. Send test messages
4. Verify messages sync to database
5. Logout and login again
6. Verify conversation and messages persist

### Test Case A2: Guest to Authenticated Migration
1. Start conversation as guest
2. Send several messages
3. Login to account
4. Verify guest conversations are preserved
5. Verify can continue conversation as authenticated user
6. Send new messages and verify they sync

### Test Case A3: Multiple Device Sync
1. Login on first device
2. Start conversation and send messages
3. Login on second device
4. Verify conversations sync across devices
5. Send messages from both devices
6. Verify real-time updates

## UI/UX Tests

### Test Case U1: Loading States
1. Verify loading indicators during:
   - Initial conversation load
   - Message sending
   - AI response generation
2. Verify smooth transitions between states

### Test Case U2: Error Handling
1. Test offline message sending
2. Test conversation loading with no network
3. Verify appropriate error messages
4. Verify retry mechanisms work

### Test Case U3: Performance
1. Load conversation with 100+ messages
2. Verify scrolling performance
3. Verify message animations remain smooth
4. Check memory usage with long conversations

## Test Environment Setup

### Prerequisites
- Clean app installation
- Test account credentials
- Multiple test devices
- Network throttling tool
- Device storage monitor

### Data Requirements
- Fresh guest install
- Existing account with conversation history
- Account with multiple devices
- Account near message limits

## Success Criteria

1. All conversations persist correctly for respective user types
2. No data loss during state transitions
3. Smooth performance with large message histories
4. Appropriate error handling and recovery
5. Correct limit enforcement for guest users
6. Successful migration path from guest to authenticated

## Bug Reporting Template

When reporting issues, include:
1. Test case reference (e.g., G1, A2)
2. User type (Guest/Authenticated)
3. Steps to reproduce
4. Expected vs actual behavior
5. Device info and app version
6. Screenshots/videos if applicable