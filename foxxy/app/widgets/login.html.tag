<loading>
  <div class="uk-text-center">
    Loading app ...
    <br><div uk-spinner></div>
  </div>

  <script>
    route('/login');
  </script>
</loading>

<login>

  <div class="uk-container uk-container-center">
    <div uk-grid class="uk-grid-small uk-child-width-1-3@s uk-flex-center uk-text-center" >
      <div>
        <h1 class="uk-margin-large-top"><i class="uk-icon-sign-in"></i> Connection</h1>
        <form class="uk-form uk-margin-top"  onsubmit="{ save_form }">


           <div class="uk-margin">
             <input type="email" placeholder="Email" class="uk-input" id="username" name="username" value="">

           </div>

           <div class="uk-margin">
             <input type="password" class="uk-input" placeholder="Mot de passe" class="uk-input" id="password" name="password" value="">
           </div>
           <hr>
           <div class="uk-margin">
             <button type="submit" class="uk-button uk-button-primary">Connection</button>
           </div>
          <div class="uk-margin-small">
             <div id="login_error" class="uk-alert uk-alert-danger uk-hidden uk-text-center">
               Bad login or password
             </div>
           </div>

        </form>

      </div>
    </div>
  </div>

  <script>
    save_form(e) {
      e.preventDefault()
      common.post(url + "auth/login", JSON.stringify({ "username": $("#username").val(), "password": $("#password").val() }) , function(data) {
        if(data.success) document.location.href="index.html";
        else {
          $("#login_error").removeClass("uk-hidden")
        }
      })
    }
  </script>

</login>
