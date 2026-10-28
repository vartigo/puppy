/* =====================================================================
   app.js  —  SHARED VUE 3 LOGIC  (used by index.html AND tailwind.html)

   Covers: Practical 2 (arrays / JSON / dynamic list), 4 (Geolocation,
           Local Storage, Drag & Drop), 7 (Vue 3 custom directives),
           9 (login + roles)  — all talking to server.js (Practical 8/10 DBs).

   HOW THE FILES FIT TOGETHER
     index.html     -> HTML markup with Bootstrap classes   (Practical 5)
     tailwind.html  -> HTML markup with Tailwind classes    (Practical 6)
     style.css      -> your own CSS + media queries         (Practical 3)
     app.js         -> THIS FILE: data, methods, directives (Practical 4, 7, 9)
     server.js      -> Node + Express + MySQL/MongoDB       (Practical 8, 9, 10)

   If the exam wants ONE html file: copy everything in this file into a
   <script> ... </script> at the bottom of index.html and delete the
   <script src="app.js"> line.

   >>> THE 4 THINGS TO EDIT IN THE EXAM <<<
     1. SITE (just below)      -> titles, texts, photos, categories, labels
     2. blankForm() + editItem -> the fields of your form
     3. the <form> in the html -> the input boxes for those fields
     4. FIELDS in server.js    -> the same field names on the backend
   ===================================================================== */


/* =====================================================================
   1. SITE CONFIG  — every placeholder text / photo lives here.
      Anything in [ square brackets ] is a placeholder: replace it.
      Photos: put image files in the  public/images/  folder and write
      the path, e.g.  "images/hero.jpg".  Leave "" to show a placeholder box.
   ===================================================================== */
const SITE = {
  // ---- branding (navbar, login screen, browser tab) ----
  title:      "[ Your Site Title ]",
  tagline:    "[ A short catchy tagline about your application ]",
  logo:       "",                 // e.g. "images/logo.png"   ("" = emoji below)
  logoEmoji:  "🏷️",              // shown when logo is ""

  // ---- hero banner (big top section) ----
  heroImage:   "",                // e.g. "images/hero.jpg"   ("" = coloured gradient)
  heroHeading: "[ Hero heading: what your application does ]",
  heroText:    "[ One or two sentences explaining who this is for and why it is useful. ]",

  // ---- what ONE record is called (so the page says "Add Book" not "Add Item") ----
  itemName:       "Item",         // singular  e.g. "Book", "Patient", "Event"
  itemNamePlural: "Items",        // plural    e.g. "Books"
  priceLabel:     "Price",        // e.g. "Fees", "Amount", "Fine"  (the numeric field)
  currency:       "₹",            // shown before the number
  categories: ["[ Category 1 ]", "[ Category 2 ]", "[ Category 3 ]"],

  // ---- the workflow columns of the board / status dropdown ----
  // keep these lowercase (they are stored in the database as the status)
  // e.g. ["available","issued","returned"]  or  ["pending","approved","rejected"]
  statuses: ["todo", "doing", "done"],

  // ---- "why us" feature cards ----
  features: [
    { icon: "⚡", title: "[ Feature 1 title ]", text: "[ One line describing the first feature. ]" },
    { icon: "🔒", title: "[ Feature 2 title ]", text: "[ One line describing the second feature. ]" },
    { icon: "📍", title: "[ Feature 3 title ]", text: "[ One line describing the third feature. ]" }
  ],

  // ---- about section ----
  aboutTitle: "[ About Us / About This Project ]",
  aboutText:  "[ A paragraph about the project, the organisation or the problem it solves. Replace this text with the topic given in your exam. ]",
  aboutImage: "",                 // e.g. "images/about.jpg"

  // ---- contact + footer ----
  contact: {
    email:   "[ name@example.com ]",
    phone:   "[ +91 00000 00000 ]",
    address: "[ Street, City, State ]"
  },
  footer: "© 2026 [ Your Name / Company ]. All rights reserved."
};


/* =====================================================================
   2. STARTUP CHECK — shows a clear message instead of a dead page
   ===================================================================== */
(function () {
  var root = document.getElementById("app");
  var problem = "";
  if (location.protocol === "file:") {
    problem = "You opened this file directly. Start the server (node server.js) and open http://localhost:3000/ instead.";
  } else if (typeof Vue === "undefined") {
    problem = "Vue did not load (no internet for the CDN?). Use a local copy of Vue (see Practical 5B note) or connect to the internet.";
  }
  if (problem) {
    root.removeAttribute("v-cloak");
    root.innerHTML = '<div style="padding:20px;color:#b00;font-size:1.2rem">' + problem + "</div>";
    throw new Error(problem);
  }
})();


/* =====================================================================
   3. THE FORM — one function so "new" and "reset" always match.
      Field names MUST match FIELDS in server.js.
      Add a field here -> add an <input v-model="form.xxx"> in the html
      -> add "xxx" to FIELDS in server.js (and a column in CREATE TABLE).
   ===================================================================== */
function blankForm() {
  return {
    title: "", description: "", category: "",
    price: "", image_url: "",
    latitude: "", longitude: ""
  };
}


/* =====================================================================
   4. THE VUE APP (Options API: data / computed / watch / mounted / methods)
   ===================================================================== */
const app = Vue.createApp({

  // ---------- STATE ----------
  data() {
    return {
      site: SITE,                       // lets the html write {{ site.title }}
      user: null,                       // { username, role, token } after login
      login: { username: "", password: "" },
      items: [],                        // array of objects from the database (Practical 2)
      form: blankForm(),
      editingId: null,                  // null = adding, otherwise the id being edited
      q: "",                            // search box text
      catFilter: "",                    // category dropdown filter
      view: "grid",                     // "grid" or "board"
      menuOpen: false,                  // mobile menu toggle (tailwind.html)
      dragId: null,                     // id of the card being dragged
      overCol: "",                      // column under the cursor while dragging
      message: "",                      // success / error text shown to the user
      newTag: "",                       // demo for the dynamic list (Practical 7)
      tags: ["Fresh", "Popular", "Sale"]
    };
  },

  // ---------- COMPUTED: values worked out from other data (auto-updating) ----------
  computed: {
    // items after applying the search box + category filter
    filteredItems() {
      const q = this.q.trim().toLowerCase();
      return this.items.filter(i =>
        (!this.catFilter || i.category === this.catFilter) &&
        (!q || ((i.title || "") + " " + (i.description || "")).toLowerCase().includes(q))
      );
    },
    // numbers for the little statistic cards: Total + one per status
    stats() {
      const rows = [{ label: "Total", count: this.items.length }];
      this.site.statuses.forEach(s => {
        rows.push({ label: s, count: this.items.filter(i => (i.status || this.site.statuses[0]) === s).length });
      });
      return rows;
    }
  },

  // ---------- RUNS ONCE WHEN THE PAGE LOADS ----------
  mounted() {
    document.title = this.site.title;                   // browser tab title
    // Practical 4B: Local Storage — restore login, draft, and chosen view
    try {
      const savedUser = localStorage.getItem("user");
      if (savedUser) { this.user = JSON.parse(savedUser); this.loadItems(); }   // JSON.parse: text -> object
      const draft = localStorage.getItem("draft");
      if (draft) this.form = Object.assign(blankForm(), JSON.parse(draft));
      this.view = localStorage.getItem("view") || "grid";
    } catch (e) {
      localStorage.clear();                             // corrupted data -> start clean
    }
  },

  // ---------- WATCH: run code whenever a value changes ----------
  watch: {
    form: {                                             // auto-save the unsaved form draft
      deep: true,
      handler(value) { localStorage.setItem("draft", JSON.stringify(value)); }   // object -> text
    },
    view(value) { localStorage.setItem("view", value); }
  },

  methods: {

    // ----- helper: every API call goes through here (adds the token header) -----
    async api(url, method = "GET", body = null) {
      const options = { method, headers: { "Content-Type": "application/json" } };
      if (this.user) options.headers.Authorization = "Bearer " + this.user.token;
      if (body) options.body = JSON.stringify(body);
      let res, data;
      try { res = await fetch(url, options); }
      catch (e) { throw new Error("Cannot reach the server. Run 'node server.js' and open http://localhost:3000 (do NOT double-click the html file)."); }
      try { data = await res.json(); }
      catch (e) { throw new Error("Server sent an invalid reply (status " + res.status + "). Check the terminal running node server.js."); }
      if (res.status === 401 && this.user) this.logout();      // token expired / server restarted
      if (!res.ok) throw new Error(data.message || "Request failed");
      return data;
    },

    // ----- AUTH (Practical 9) -----
    async doLogin() {
      try {
        const data = await this.api("/api/login", "POST", this.login);
        this.user = { username: data.username, role: data.role, token: data.token };
        localStorage.setItem("user", JSON.stringify(this.user));
        this.message = "";
        this.login.password = "";
        this.loadItems();
      } catch (e) { this.message = e.message; }
    },
    logout() {
      this.user = null;
      this.items = [];
      localStorage.removeItem("user");
    },

    // ----- READ -----
    async loadItems() {
      try { this.items = await this.api("/api/items"); }
      catch (e) { this.message = e.message; }
    },
    // items of one status column (used by the board view)
    itemsIn(col) {
      return this.filteredItems.filter(i => (i.status || this.site.statuses[0]) === col);
    },

    // ----- CREATE / UPDATE -----
    async saveItem() {
      try {
        if (this.editingId) {
          await this.api("/api/items/" + this.editingId, "PUT", this.form);
          this.message = this.site.itemName + " updated";
        } else {
          await this.api("/api/items", "POST", this.form);
          this.message = this.site.itemName + " saved";
        }
        this.resetForm();
        this.loadItems();
        this.goTo("items");
      } catch (e) { this.message = e.message; }
    },
    editItem(item) {
      this.editingId = item.id;
      this.form = Object.assign(blankForm(), {
        title: item.title, description: item.description || "", category: item.category || "",
        price: item.price == null ? "" : item.price, image_url: item.image_url || "",
        latitude: item.latitude == null ? "" : item.latitude,
        longitude: item.longitude == null ? "" : item.longitude
      });
      this.goTo("manage");
    },
    resetForm() {
      this.editingId = null;
      this.form = blankForm();
    },

    // change only the status (used by the dropdown on cards AND by drag & drop)
    async moveItem(item, status) {
      try { await this.api("/api/items/" + item.id, "PUT", { status }); this.loadItems(); }
      catch (e) { this.message = e.message; }
    },

    // ----- DELETE (admin only; the server returns 403 for others) -----
    async removeItem(id) {
      if (!confirm("Delete this " + this.site.itemName.toLowerCase() + "?")) return;
      try { await this.api("/api/items/" + id, "DELETE"); this.loadItems(); }
      catch (e) { this.message = e.message; }
    },

    // ----- DRAG & DROP (Practical 4C): dropping a card on a column changes its status -----
    onDrop(col) {
      this.overCol = "";
      const item = this.items.find(i => String(i.id) === String(this.dragId));
      this.dragId = null;
      if (item) this.moveItem(item, col);
    },

    // ----- GEOLOCATION (Practical 4A): needs localhost/HTTPS + user permission -----
    getLocation() {
      if (!navigator.geolocation) { this.message = "Geolocation not supported"; return; }
      navigator.geolocation.getCurrentPosition(
        pos => {
          this.form.latitude = pos.coords.latitude;
          this.form.longitude = pos.coords.longitude;
        },
        err => { this.message = "Location error: " + err.message; }
      );
    },

    // ----- dynamic list demo (Practical 7): push() adds, splice() removes -----
    addTag() {
      const value = this.newTag.trim();
      if (value) this.tags.push(value);
      this.newTag = "";
    },
    removeTag(index) { this.tags.splice(index, 1); },

    // smooth scroll to a section of the page (navbar links + buttons)
    goTo(id) {
      this.$nextTick(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      });
    }
  }
});


/* =====================================================================
   5. CUSTOM DIRECTIVES (Practical 7)
      Vue 3 hooks are named  mounted / updated.
      Register WITHOUT "v-" here; use WITH "v-" in the HTML.
   ===================================================================== */

// v-uppercase : click the element -> its text becomes UPPERCASE
app.directive("uppercase", {
  mounted(el) {
    el.style.cursor = "pointer";
    el.addEventListener("click", () => { el.textContent = el.textContent.toUpperCase(); });
  }
});

// v-date : formats a date value.  Function shorthand = runs on mounted AND updated.
app.directive("date", (el, binding) => {
  const d = new Date(binding.value);
  el.textContent = Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
});

app.mount("#app");   // attach to <div id="app"> in the html
