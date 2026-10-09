import 'dotenv/config';
import fetch from 'node-fetch';
import { io } from 'socket.io-client';
import { initModels } from '../src/db/models/index.js';
import { signAccessToken } from '../src/utils/jwt.js';

const API = 'http://localhost:5001/api/v1';

async function run() {
  console.log('=== STARTING MESSAGING & NOTIFICATIONS E2E VERIFICATION ===');

  const models = initModels();
  const travellerUser = await models.User.findByPk(13);
  const agencyUser = await models.User.findByPk(12);

  if (!travellerUser || !agencyUser) {
    throw new Error('Test users 13 or 12 not found in DB');
  }

  const travellerToken = signAccessToken(travellerUser);
  const agencyToken = signAccessToken(agencyUser);

  console.log(`✓ Traveller token generated: ID ${travellerUser.id} (${travellerUser.email}, role: ${travellerUser.role})`);
  console.log(`✓ Agency token generated: ID ${agencyUser.id} (${agencyUser.email}, role: ${agencyUser.role})`);

  // 2. Setup Socket connections
  console.log('\n2. Connecting WebSockets...');
  const agencySocket = io('http://localhost:5001', {
    path: '/socket.io',
    auth: { token: agencyToken },
  });

  const travellerSocket = io('http://localhost:5001', {
    path: '/socket.io',
    auth: { token: travellerToken },
  });

  await new Promise((resolve) => {
    let connected = 0;
    const check = () => { connected++; if (connected === 2) resolve(); };
    agencySocket.on('connect', check);
    travellerSocket.on('connect', check);
  });
  console.log('✓ Both agency and traveller sockets connected and joined user rooms');

  // Listen for real-time events on agency side (even without joining conversation room!)
  let agencyReceivedNotif = null;
  let agencyReceivedDeleted = null;
  let agencyReceivedUpdated = null;

  agencySocket.on('notification:new', (notif) => {
    agencyReceivedNotif = notif;
    console.log(`  [Agency Socket] notification:new received -> ID: ${notif.id}, Title: "${notif.title}", Body: "${notif.body}"`);
  });

  agencySocket.on('conversation:deleted', (payload) => {
    agencyReceivedDeleted = payload;
    console.log(`  [Agency Socket] conversation:deleted received -> Msg ID: ${payload.messageId}, Mode: ${payload.mode}`);
  });

  agencySocket.on('MESSAGE_DELETED_FOR_EVERYONE', (payload) => {
    console.log(`  [Agency Socket] MESSAGE_DELETED_FOR_EVERYONE received -> Msg ID: ${payload.messageId}`);
  });

  agencySocket.on('conversation:updated', (payload) => {
    agencyReceivedUpdated = payload;
    console.log(`  [Agency Socket] conversation:updated received -> Conv ID: ${payload.conversationId}`);
  });

  // 3. Find active conversation between Traveller and Agency
  console.log('\n3. Locating active conversation...');
  const convRes = await fetch(`${API}/conversations`, {
    headers: { Authorization: `Bearer ${travellerToken}` },
  });
  const convData = await convRes.json();
  const conv = convData.data.conversations?.[0];
  if (!conv) throw new Error('No active conversation found for testing');
  const convId = conv.id;
  console.log(`✓ Using Conversation ID: ${convId} (Request #${conv.travelRequestId})`);

  // 4. TEST PROBLEM 2: Route-independent message notification
  console.log('\n4. Testing message notification generation (Recipient is NOT in chat room)...');
  const testMsgText = `Test notification verification ${Date.now()}`;
  const sendRes = await fetch(`${API}/conversations/${convId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${travellerToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ body: testMsgText }),
  });
  const sendData = await sendRes.json();
  const sentMessage = sendData.data.message || sendData.data;
  console.log(`✓ Message sent by Traveller -> ID: ${sentMessage.id}, Body: "${sentMessage.body}"`);

  // Wait 1 second for async notification delivery
  await new Promise((r) => setTimeout(r, 1000));

  // Verify agency received real-time socket notification in their user room
  if (!agencyReceivedNotif) {
    throw new Error('FAIL: Agency did not receive real-time notification:new event');
  }
  console.log('✓ Agency received notification:new event in user room');
  console.log(`  Title: ${agencyReceivedNotif.title}`);
  console.log(`  Body: ${agencyReceivedNotif.body}`);
  console.log(`  DeepLink: ${agencyReceivedNotif.deepLink}`);

  // Verify DB notification record exists for agency
  const notifRes = await fetch(`${API}/notifications?limit=10`, {
    headers: { Authorization: `Bearer ${agencyToken}` },
  });
  const notifsData = await notifRes.json();
  const notifList = Array.isArray(notifsData.data) ? notifsData.data : (notifsData.data?.items || []);
  const dbNotif = notifList.find((n) => Number(n.id) === Number(agencyReceivedNotif.id) || Number(n.entityId) === Number(sentMessage.id));
  if (!dbNotif) throw new Error('FAIL: Notification DB record not found for agency');
  console.log(`✓ DB Notification verified: ID ${dbNotif.id}, Status: ${dbNotif.status}, isRead: ${dbNotif.isRead}`);

  // 5. TEST PROBLEM 1: Delete for Everyone
  console.log('\n5. Testing Delete for Everyone...');
  
  // Security Test: Agency attempts to delete Traveller's message for everyone
  console.log('  Testing security authorization: Agency attempts to delete Traveller\'s message for everyone...');
  const illicitDeleteRes = await fetch(`${API}/conversations/${convId}/messages/${sentMessage.id}?mode=everyone`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${agencyToken}` },
  });
  console.log(`  Agency illicit delete HTTP status: ${illicitDeleteRes.status} (Expected: 403)`);
  if (illicitDeleteRes.status !== 403) {
    throw new Error(`FAIL: Unauthorized delete should return 403, got ${illicitDeleteRes.status}`);
  }
  console.log('✓ Unauthorized deletion blocked with 403 Forbidden');

  // Security Test: Attempting delete with wrong conversation ID
  console.log('  Testing cross-conversation authorization failure...');
  const crossConvRes = await fetch(`${API}/conversations/999999/messages/${sentMessage.id}?mode=everyone`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${travellerToken}` },
  });
  console.log(`  Cross-conversation delete HTTP status: ${crossConvRes.status} (Expected: 404 or 403)`);
  if (crossConvRes.status !== 404 && crossConvRes.status !== 403) {
    throw new Error(`FAIL: Cross-conversation delete should fail, got ${crossConvRes.status}`);
  }
  console.log('✓ Cross-conversation deletion blocked');

  // Owner deletes own message for everyone
  console.log('  Traveller executes Delete for Everyone on own message...');
  const deleteRes = await fetch(`${API}/conversations/${convId}/messages/${sentMessage.id}?mode=everyone`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${travellerToken}` },
  });
  const deleteData = await deleteRes.json();
  console.log(`✓ Delete response status: ${deleteRes.status}, data:`, deleteData.data);

  // Wait for socket broadcast
  await new Promise((r) => setTimeout(r, 600));

  if (!agencyReceivedDeleted) {
    throw new Error('FAIL: Agency did not receive conversation:deleted event');
  }
  console.log('✓ Agency received real-time conversation:deleted event without refresh');

  // 6. Test Persistence and Refresh: GET messages
  console.log('\n6. Testing Persistence & Fresh Fetch (Simulating Page Refresh / New Tab)...');
  const getMsgsRes = await fetch(`${API}/conversations/${convId}/messages?limit=30`, {
    headers: { Authorization: `Bearer ${agencyToken}` },
  });
  const getMsgsData = await getMsgsRes.json();
  const fetchedDeletedMsg = getMsgsData.data.messages.find((m) => m.id === sentMessage.id);
  
  if (!fetchedDeletedMsg) throw new Error('FAIL: Message not found in conversation messages');
  console.log(`  Fetched deleted message: Body: "${fetchedDeletedMsg.body}", isDeletedForEveryone: ${fetchedDeletedMsg.isDeletedForEveryone}`);
  
  if (fetchedDeletedMsg.body !== 'This message was deleted' || !fetchedDeletedMsg.isDeletedForEveryone) {
    throw new Error(`FAIL: Message body exposed or not marked deleted: "${fetchedDeletedMsg.body}"`);
  }
  if (fetchedDeletedMsg.body === testMsgText) {
    throw new Error('CRITICAL FAIL: Original message text reappeared after deletion!');
  }
  console.log('✓ Fresh GET messages returns "This message was deleted", original content never leaked');

  // 7. Test Pagination with cursor `before`
  console.log('\n7. Testing Pagination with before cursor...');
  const paginatedRes = await fetch(`${API}/conversations/${convId}/messages?before=${sentMessage.id + 1}&limit=10`, {
    headers: { Authorization: `Bearer ${agencyToken}` },
  });
  const paginatedData = await paginatedRes.json();
  const paginatedMsg = paginatedData.data.messages.find((m) => m.id === sentMessage.id);
  if (paginatedMsg) {
    if (paginatedMsg.body !== 'This message was deleted' || !paginatedMsg.isDeletedForEveryone) {
      throw new Error(`FAIL: Paginated message has incorrect body: "${paginatedMsg.body}"`);
    }
    console.log('✓ Paginated fetch respects deleted tombstone state');
  }

  // 8. Test Notification Sanitization: Ensure notification DB record no longer contains deleted body
  console.log('\n8. Checking Notification sanitization...');
  const recheckNotifs = await fetch(`${API}/notifications?limit=10`, {
    headers: { Authorization: `Bearer ${agencyToken}` },
  });
  const recheckData = await recheckNotifs.json();
  const recheckList = Array.isArray(recheckData.data) ? recheckData.data : (recheckData.data?.items || []);
  const sanitizedNotif = recheckList.find((n) => Number(n.id) === Number(agencyReceivedNotif.id) || Number(n.entityId) === Number(sentMessage.id));
  if (sanitizedNotif) {
    console.log(`  Sanitized notification body: "${sanitizedNotif.body}"`);
    if (sanitizedNotif.body.includes(testMsgText)) {
      throw new Error('FAIL: Notification still contains raw deleted message body');
    }
    console.log('✓ Notification sanitized, raw deleted content removed');
  }

  agencySocket.disconnect();
  travellerSocket.disconnect();

  console.log('\n=== ALL E2E TESTS PASSED SUCCESSFULLY! ===');
  process.exit(0);
}

run().catch((err) => {
  console.error('\n❌ TEST RUN FAILED:', err);
  process.exit(1);
});
