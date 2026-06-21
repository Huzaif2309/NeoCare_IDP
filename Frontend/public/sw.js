self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : { title: "NeoCare Alert", body: "An anomaly was detected." };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: "neocare-alert",
      renotify: true,
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow("/dashboard"));
});
