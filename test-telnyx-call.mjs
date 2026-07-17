// Test script - check Telnyx setup and try making a call
const TELNYX_API_KEY = "8dd62c5680295717f9d69ecc516a1df9fbedeccb50190d3bc814c48a30680941";
const TEST_NUMBER = "+5519995125321";

async function telnyxFetch(path, options = {}) {
    const res = await fetch(`https://api.telnyx.com${path}`, {
        ...options,
        headers: {
            'Authorization': `Bearer ${TELNYX_API_KEY}`,
            'Content-Type': 'application/json',
            ...options.headers,
        }
    });
    const data = await res.json();
    if (!res.ok) {
        const err = data?.errors?.[0]?.detail || data?.message || JSON.stringify(data);
        throw new Error(`Telnyx API error (${res.status}): ${err}`);
    }
    return data;
}

async function run() {
    console.log("=== 1. Listing Voice API Applications ===");
    const apps = await telnyxFetch('/v2/call_control_applications?page[size]=10');
    const appList = apps.data || [];
    if (appList.length === 0) {
        console.error("❌ NO Voice API Apps found! You must create one in the Telnyx portal first.");
        process.exit(1);
    }
    appList.forEach((app, i) => {
        console.log(`  [${i}] ID: ${app.id} | Name: ${app.friendly_name} | Webhook: ${app.webhook_event_url || '-- NONE --'}`);
    });

    const validApp = appList.find(a => a.webhook_event_url || a.webhook_url) || appList[0];
    console.log(`\n✅ Using App: "${validApp.friendly_name}" (ID: ${validApp.id})`);
    const connectionId = validApp.id;

    console.log("\n=== 2. Listing Phone Numbers ===");
    const numbers = await telnyxFetch('/v2/phone_numbers?page[size]=20&filter[status]=active');
    const numList = numbers.data || [];
    if (numList.length === 0) {
        console.error("❌ No active phone numbers in your account!");
        process.exit(1);
    }
    numList.forEach((n, i) => {
        console.log(`  [${i}] Number: ${n.phone_number} | connection_id: ${n.connection_id || '-- NOT LINKED --'}`);
    });

    // Find a number linked to this app
    const linkedNum = numList.find(n => n.connection_id === connectionId);
    let fromNumber;
    if (linkedNum) {
        fromNumber = linkedNum.phone_number;
        console.log(`\n✅ Found number linked to the app: ${fromNumber}`);
    } else {
        fromNumber = numList[0].phone_number;
        console.warn(`\n⚠️  No number is linked to the Voice API App (connection_id=${connectionId}).`);
        console.warn(`   You MUST link your number to the app in the Telnyx portal (Numbers → My Numbers → edit → Connection = your app).`);
        console.warn(`   Trying anyway with first number: ${fromNumber} (this will likely fail)`);
    }

    console.log(`\n=== 3. Attempting Test Call to ${TEST_NUMBER} ===`);
    console.log(`   From: ${fromNumber}`);
    console.log(`   connection_id: ${connectionId}`);

    const callResult = await telnyxFetch('/v2/calls', {
        method: 'POST',
        body: JSON.stringify({
            connection_id: connectionId,
            to: TEST_NUMBER,
            from: fromNumber,
        })
    });

    console.log("\n🎉 SUCCESS! Call initiated!");
    console.log("   call_control_id:", callResult.data?.call_control_id);
    console.log("   state:", callResult.data?.state);
}

run().catch(e => {
    console.error("\n❌ ERROR:", e.message);
    process.exit(1);
});
