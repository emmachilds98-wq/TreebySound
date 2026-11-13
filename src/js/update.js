(function(){
  var updateBtn = document.getElementById('updateBtn');
  var reloading = false;

  function reloadNow(){
    if(reloading) return;
    reloading = true;
    /* Everything that matters (checklist ticks, appearance, job data) lives in
       localStorage, which a reload never touches — nothing is lost here. */
    location.reload();
  }

  /* The refresh button always reloads, service worker or not — installed to
     the home screen there's no browser reload to fall back on, and the page is
     served network-first (see sw.js), so a reload is what fetches a newer copy.
     When there is a worker we give it a moment to go looking for a new version
     first, so one tap lands on the new one instead of needing a second. It
     never gets to block the reload: whichever finishes first wins. */
  if(updateBtn){
    updateBtn.title = 'Refresh — check for a newer version';
    updateBtn.addEventListener('click', function(){
      if(reloading) return;
      updateBtn.classList.add('busy');
      if(!('serviceWorker' in navigator)){ reloadNow(); return; }
      var fired = false;
      var go = function(){ if(fired) return; fired = true; reloadNow(); };
      setTimeout(go, 2500);
      navigator.serviceWorker.getRegistration()
        .then(function(reg){ return reg ? reg.update() : null; })
        .then(go, go);
    });
  }

  if(!('serviceWorker' in navigator)) return;
  /* The service worker already skips waiting and claims every open tab the
     moment a new version activates (see sw.js) — no message-passing needed
     here, just a reload so this tab's already-loaded HTML/JS catches up.
     hadController starts true only on a repeat visit, so the very first
     install (nothing to refresh into) doesn't reload the page it just opened. */
  var hadController = !!navigator.serviceWorker.controller;

  function markReady(){
    if(!updateBtn) return;
    updateBtn.classList.add('ready');
    updateBtn.setAttribute('aria-label', 'An update is ready — tap to refresh TreebySound');
    updateBtn.title = 'Update ready — tap to refresh';
  }

  navigator.serviceWorker.addEventListener('controllerchange', function(){
    if(!hadController){ hadController = true; return; }
    /* A backgrounded tab can update itself with nobody watching. One that's
       on screen right now gets the button instead — reloading out from under
       someone mid-read or mid-tap would be worse than asking for one press. */
    if(document.hidden){
      reloadNow();
    } else {
      markReady();
    }
  });

  document.addEventListener('visibilitychange', function(){
    if(document.hidden && updateBtn && updateBtn.classList.contains('ready')) reloadNow();
  });

  window.addEventListener('load', function(){
    navigator.serviceWorker.register('./sw.js').then(function(reg){
      /* Browsers only recheck sw.js for changes on a fresh navigation, which a
         long-lived open tab may never do — so ask again whenever it's looked at. */
      document.addEventListener('visibilitychange', function(){
        if(!document.hidden) reg.update().catch(function(){});
      });
    }).catch(function(){});
  });
})();