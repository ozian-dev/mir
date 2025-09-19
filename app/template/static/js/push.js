
function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const raw = atob(base64);
    return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

function arrayBufferToBase64(buffer) {
    return btoa(String.fromCharCode.apply(null, new Uint8Array(buffer)));
}


async function resubscribe() {
    try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (let registration of registrations) {
            await registration.unregister();
        }
        await new Promise(resolve => setTimeout(resolve, 1000));

        if ('caches' in window) {
            const names = await caches.keys();
            await Promise.all(names.map(n => caches.delete(n)));
        }

        const registration = await navigator.serviceWorker.register("/zsw.js", {scope: "/", updateViaCache: 'none'});
        try {
            const readyPromise = navigator.serviceWorker.ready;
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Service Worker ready timeout')), 5000)
            );
            await Promise.race([readyPromise, timeoutPromise]);
        } catch (err) {
            console.log("Service Worker not ready in time:", err);
        }

        const response = await fetch("/vapid_public_key");
        const { vapidPublicKey } = await response.json();

        console.log(Notification.permission)
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        });
        const subscribeResponse = await fetch("/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                uid:  _p["group"] + "." + _p["user"],
                endpoint: subscription.endpoint,
                keys: {
                    p256dh: arrayBufferToBase64(subscription.getKey("p256dh")),
                    auth: arrayBufferToBase64(subscription.getKey("auth"))
                }
            })
        });

        const result = await subscribeResponse.json();
        console.log("subscribeResponse.result");
        console.log(result);
        
    } catch (error) {
        console.log("resubscribe.error.message");
        console.log(error.message);
    }
}


async function requestPermission() {
    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {

            console.log('call re-subscribe');
            resubscribe();
        }
    } catch (error) {
        console.log('requestPermission.error.message');
        console.log(error.message);
    }
}


async function checkPushStatus() {
    try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
            const subscription = await registration.pushManager.getSubscription();

            if (!subscription) {
                console.log("subscription: deactivated");
                requestPermission();
            } else {
                if (_p['is_pushable'] == 'False') {
                    resubscribe();
                }
            }
        } else {
            console.log("serviceWorker: unregistered.");
            requestPermission();
        }
    } catch (e) {
        console.log('catch')
        console.log(e.message);
    }
}


function setPushEnv() {
    if (_p["push"] == "True") {
        checkPushStatus()

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(registration => {
                console.log('serviceWorker ready');
                navigator.serviceWorker.addEventListener('message', event => {
                    const data = event.data;
                    if (data.type === 'PUSH_MESSAGE') {
                        console.log('received message:', data);

                        let info = data['payload']['data']
                        let msg = $('<a>')
                            .addClass('white')
                            .attr('href',info['url'])
                            .attr('target','_win')
                            .html(data['payload']['body']);
                        modal($(msg).prop('outerHTML'), false);

                        let progressObj = "#pan" + info['pid'] + " .action a.att-btn[data-target='"+info['target'] + "'] span";
                        $(progressObj).removeClass('loader').addClass('loader-done');
                    }
                });
            });
        }
    }
}