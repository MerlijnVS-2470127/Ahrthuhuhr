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

**Lone Wolf**: deze user staat los van iedereen en zit in geen enkele groep

links within markdown-> link naar appendix

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

### Sidebar

#### Events

#### Group controls

#### Polls

## Events

### Event Creation

### EventView

#### Attendees

#### Externe bronnen

#### pdf conversion

### Shippy

## Map
