Begin: uitleg exampledata, inloggegevens bijzondere users + hun bijzonderheid

Per pagina/feature een hoofdstuk

ai usage

# FellowShips: hét platform voor reizen in groep

Setup project (docker):

build: `docker build . -t webprogramming/project`

run: `docker run -it -p 8080:80 webprogramming/project`

Bij de initiële opstart zal er automatisch voorbeelddata worden toegevoegd aan de database (`exampleData.js`). Als dit correct verloopt zal ook in de terminal output te zien zijn wat er juist is toegevoegd. De voorbeelddata bestaat uit enkele users, groepen waaraan de users worden toegevoegd, events binnen die groepen waar voor enkele users hun aanwezigheid reeds hebben opgegeven, messages in de groepchat en polls waarop al gestemd is door de users. Om de site te verkennen stellen we enkele useraccounts voor en wat hen typeert.

---

**Admin**: zit in elke groep en heeft in elke groep de admin-rol

Email: `admin`

Password: `admin`

---

**John Doe**: owner van de testgroep, kan gebruikt worden om de ownercontrols in de groep te testen (members toevoegen/verwijderen, promoten/demoten, lurken/delurken en de groep verwijderen). John is ook creator van meerdere events bv: _Test Group meetup_.

Email: `john@example.com`

Password: `password1`

---

**Lone Wolf**: deze user staat los van iedereen en zit in geen enkele groep. Dit is ideaal om de verschillende pagina's uit te testen voor het geval dat er niks is om in te laden (op de groups page en events page).

Email: `lone@wolf.com`

Password: `iamsolonely`

---

Login informatie van overige example-accounts is te vinden [aan het einde](#logins-overige-accounts) te vinden.

## Login

Bij de login pagina kan de gebruiker een email en wachtwoord ingeven en verzenden met de "Log in" knop. Als het wachtwoord en email matchen, dan wordt de gebruiker ingelogd en gestuurd naar de homepagina. Als die niet matchen wordt er een bericht getoond onder het "password" invoerveld.
Door te klikken op de knop "Create account" wordt het login formulier gesloten en opent het "register" formulier.

## Account creation

Bij het "register" formulier, kan een gebruiker een email en twee keer een wachtwoord ingeven. Als het email-adres al in de databank staat of de wachtwoorden niet overeen komen, wordt er een error getoond onder het "Confirm password" invoerveld. Als dat niet het geval is, wordt er een user aangemaakt in de databank en wordt de gebruiker gestuurd naar de homepagina.

## Header en Footer

De header en de footer zijn partials die op elke pagina buiten de loginpagina staan. De header en footer staan respectievelijk aan de boven- en onderkant van de pagina. In beiden staat een knop om naar de homepagina te gaan (het vliegtuigje). In de header zijn nog 5 navigatie items.

- Groups: Hierbij wordt de gebruiker gestuurd naar de "Groups" pagina.
- Events: Hierbij wordt de gebruiker gestuurd naar de "Events" pagina.
- Map: Hierbij wordt de gebruiker gestuurd naar de "Map" pagina.
- Shippy: Hierbij wordt de gebruiker gestuurd naar de "Shippy" pagina.

Ten slotte is er nog de gebruiker. Dit heeft automatisch de naam van de huidig ingelogde gebruiker. Als daar op gedrukt wordt, opent er een dropdown lijst met twee items. "Edit profile" opent de "profile" pagina en "Log out" logt de gebruiker uit en stuurt die terug naar de login-pagina.

##

In de footer zijn er twee knoppen naast de voorheen genoemde homeknop. Die knoppen zijn de "about us" en "FAQ" knoppen, die alle twee naar de FAQ pagina leiden.

## Home page

De homepagina is verdeeld in twee, groups en events. Die tonen de eerste drie groepen en evenementen waar de gebruiker een deel van uitmaakt. Door op de "open chat" knop van een groep te klikken, wordt de gebruiker gestuurd naar de chatpagina van die groep. Daarnaast kan de gebruiker ook op de "View event" knop van een evenement drukken. Daardoor wordt de gebruiker gestuurd naar de eventview pagina van die groep.

## FAQ

De FAQ pagina is een pagina waar de gebruiker veelgestelde vragen en de "about us" kan vinden.

## Groups

Op de groups pagina kan de gebruiker al de groepen zien waar die in zit.
Vanboven is er de "Add Group" knop. Die knop leidt de gebruiker naar de groupcreation pagina. Door op de "Open chat" knop van een groep te klikken wordt de gebruiker gestuurd naar de groepchat van die groep.

## Group Creation

Op deze pagina kan de gebruiker een groep aanmaken. Het "Group name" invoerveld is verplicht en mag niet meer dan 30 karakters hebben. Het "Description" invoerveld is niet verplicht en mag niet meer dan 100 karakters hebben. Als het karakterlimiet overschreden wordt van een van de invoervelden, komt er een error onder het invoerveld te staan.

## Chat

### Chat

G-man

### Sidebar

De sidebar is onderverdeeld in drie tabs. Deze drie zijn: Events, Info en Polls. Door vanboven aan de sidebar op een van de tabs teklikken, wordt die tab ingeladen.

#### Events

De sidepanel start op de events tab. Hier staan alle evenementen die aan de groep verbonden zijn en nu zijn aan het gebeuren of nog gepland zijn. Door eender waar op een evenement te klikken, opent de eventview pagina met alle info over het geselecteerde evenement.

#### Group controls

Als er op de "Info" knop gedrukt wordt, wordt de info van de groep getoond. Elke gebruiker buiten de owner kan de groep verlaten door op de "Leave" knop te drukken. Als de gebruiker een admin is, kan die leden toevoegen en kicken zolang dat lid niet de owner is of zichzelf. Als de gebruiker de owner is, kan die alles wat de admin kan en kan die de rollen van gebruikers aapassen. Er zijn vier rollen: Owner, admin, member en lurker. Als lurker kan het lid niet meedoen met polls. Daarnaast kan de owner ook de groep verwijderen in plaats van de groep te verlaten. Als de gebruiker dan op "Delete" klikt, komt er een prompt die aangeeft dat dit permanent is en om de groep te verwijderen de gebruiker de naam van de groep uit moet typen als extra voorzorgmaatregel.

#### Polls

G-man

## Events

G-man

### Event Creation

G-man

### EventView

G-man

#### Attendees

G-man

#### Externe bronnen

G-man

#### pdf conversion

G-man

### Shippy

G-man

## Map

G-man

## Offline

## Logins overige accounts

\<username>: \<email>; \<password>

Gerben: gerben@example.com; password2

Merlijn: merlijn@example.com; password3

Kitty2610: kitty@example.com; password4

Yara: yara@example.com; password5

Rob: maria@example.com; password6

Michael: linux@example.com; password7

Joost: rooster@example.com; password8

Ronny: ranjot@example.com; password9

Vansh: vanshpreet@example.com; password10
