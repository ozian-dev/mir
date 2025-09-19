self.addEventListener('install', function(event) {
    console.log('serviceWorker install');
    self.skipWaiting();
});

self.addEventListener('activate', function(event) {
    console.log('serviceWorker activate');
    event.waitUntil(self.clients.claim());
});


self.addEventListener('push', function(event) {
    console.log('received push event:', event);
    
    let title = 'New Message';
    let body = 'receive messages';
    let url = '/';
    let data = {};
    
    if (event.data) {
        try {
            const textData = event.data.text();
            console.log('serviceWorker origin data:', textData);
            
            if (textData.trim().startsWith('{')) {
                data = JSON.parse(textData);
                body = data.msg || body;
                title = data.title || title;
                url = `/?.g=${data.grp}#/rest/workplace?.g=${data.grp}&.i=${data.mid}` || url;
            } else {
                console.log('serviceWorker test:', textData);
                body = textData;
            }
        } catch (error) {
            console.error('serviceWorker message parsing error:', error);
            body = 'receive messages';
        }
    }

    const options = {
        body: body,
        tag: String(Date.now()) ,
        requireInteraction: false,
        renotify: true,
        data: {
            grp: data.grp,
            mid: data.mid,
            pid: data.pid,
            target: data.target,
            url: url,
            timestamp: Date.now()
        }
    };
    
    event.waitUntil(
        self.registration.showNotification(title, options)
            .then(() => {
                console.log('serviceWorker showNotification ok');

                return clients.matchAll({ type: 'window', includeUncontrolled: true })
                    .then(clientList => {
                        clientList.forEach(client => {
                            client.postMessage({
                                type: 'PUSH_MESSAGE',
                                payload: options
                            });
                        });
                    });


            })
            .catch(error => {
                console.error('serviceWorker showNotification error:', error);
            })
    );
});



self.addEventListener('notificationclick', function(event) {
    console.log('serviceWorker notificationclick:', event.notification);
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data?.url || '/')
    );
});

self.addEventListener('notificationclose', function(event) {
    console.log('serviceWorker notificationclose:', event.notification);
});

self.addEventListener('message', function(event) {
    console.log('serviceWorker receive message:', event.data);
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

self.addEventListener('error', function(event) {
    console.error('serviceWorker error:', event.error);
});

self.addEventListener('unhandledrejection', function(event) {
    console.error('serviceWorker unhandledrejection:', event.reason);
});
