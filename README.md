# FellowShips: hét platform voor reizen in groep

Setup project (local):

install dependencies: `npm install`

run: `node app.js`

---

Setup project (docker):

build: `docker build . -t webprogramming/project`

run: `docker run -it -p 8080:80 webprogramming/project`

-> in commandline wordt weergegeven dat de server runt op port 1337, maar je moet surfen naar localhost:8080 om de site te berijken.

---

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

Login informatie van de overige example-accounts is [aan het einde](#logins-overige-accounts) te vinden. Bijkomende informatie over de werking van de site wordt per pagina en feature in detail besproken.

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

In de footer zijn er twee knoppen naast de voorheen genoemde homeknop. Die knoppen zijn de "about us" en "FAQ" knoppen, die alle twee naar de FAQ pagina leiden.

## Home page

De homepagina is verdeeld in twee, groups en events. Die tonen de eerste drie groepen en evenementen waar de gebruiker een deel van uitmaakt. Door op de "open chat" knop van een groep te klikken, wordt de gebruiker gestuurd naar de chatpagina van die groep. Daarnaast kan de gebruiker ook op de "View event" knop van een evenement drukken. Daardoor wordt de gebruiker gestuurd naar de eventview pagina van die groep.

## FAQ

De FAQ pagina is een pagina waar de gebruiker veelgestelde vragen en de "about us" kan vinden.

## Groups

Op de groups pagina kan de gebruiker al de groepen zien waar die in zit.
Vanboven is er de "Add Group" knop. Die knop leidt de gebruiker naar de groupcreation pagina. Door op de "Open chat" knop van een groep te klikken wordt de gebruiker gestuurd naar de groepchat van die groep.

## Group Creation

Op deze pagina kan de gebruiker een groep aanmaken. Het "Group name" invoerveld is verplicht en mag niet meer dan 40 karakters hebben. Het "Description" invoerveld is niet verplicht en mag niet meer dan 100 karakters hebben. Als het karakterlimiet overschreden wordt van een van de invoervelden, komt er een error onder het invoerveld te staan.

## Groupchat

### Chat

De linkerhelft van de groupchat-pagina bevat de chat. Je kunt onderaan een bericht sturen dat na verzending zichtbaar wordt in de chat. Deze chat wordt automatisch geüpdatet, waardoor het nieuwe bericht zichtbaar is over meerdere instances. De usernames in de chat zijn gekleurd op basis van hun rol: owner=rood, admin=groen, member=zwart, lurker=grijs.

### Sidebar

De sidebar is onderverdeeld in drie tabs. Deze drie zijn: Events, Info en Polls. Door vanboven aan de sidebar op een van de tabs teklikken, wordt die tab ingeladen.

#### Events

De sidepanel start op de events tab. Hier staan alle evenementen die aan de groep verbonden zijn en nu zijn aan het gebeuren of nog gepland zijn. Door eender waar op een evenement te klikken, opent de eventview pagina met alle info over het geselecteerde evenement.

#### Group controls

Als er op de "Info" knop gedrukt wordt, wordt de info van de groep getoond. Elke gebruiker buiten de owner kan de groep verlaten door op de "Leave" knop te drukken. Als de gebruiker een admin is, kan die leden toevoegen en kicken zolang dat lid niet de owner is of zichzelf. Als de gebruiker de owner is, kan die alles wat de admin kan en kan die de rollen van gebruikers aapassen. Er zijn vier rollen: Owner, admin, member en lurker. Als lurker kan het lid niet meedoen met polls. Daarnaast kan de owner ook de groep verwijderen in plaats van de groep te verlaten. Als de gebruiker dan op "Delete" klikt, komt er een prompt die aangeeft dat dit permanent is en om de groep te verwijderen de gebruiker de naam van de groep uit moet typen als extra voorzorgmaatregel.

#### Polls

Elke groep heeft de optie om polls aan te maken. Elk groeplid dat geen lurker-rol heeft kan polls aanmaken. Er kan gekozen worden voor een endtime, 2 tot en met 10 opties en er kan gekozen worden voor een single choice of multiple choice poll. Alle groepsleden kunnen aangemaakte polls zien. Iedereen buiten lurkers kunnen ook stemmen. Aan de rechterzijde wordt ook aangegeven hoeveel stemmen een polloptie heeft gekregen. Single-choice polls gebruiken radio buttons (cirkelvormig). Multiple-choice polls gebruiken checkboxes (vierkant).

## Events

Op de algemene eventpagina kan de gebruiker alle events zien die horen bij groepen waar ze lid van zijn. De events zijn chronologisch op starttijd geordend. Bovenaan de pagina zijn er filters voor event-status. Je kunt ook filteren op individuele groepen. Standaard worden enkel events die bezig zijn of nog moeten komen weergegeven. Afgelopen en afgelaste events hebben een rode titel, events die bezig zijn zijn blauw en events die nog moeten komen zijn groen. Elk event wordt voorgesteld door een tegel. Hierin is in het kort de belangrijkste informatie te zien. De groepnaam is aanklikbaar en stuurt je door naar de corresponderende groepchat. Locaties met valid coördinaten zijn ook aanklikbaar en sturen je door naar de webpagina waar met een marker de locatie van het event aangewezen wordt. Via 'view event' kun je de uitgebreide individuele eventpagina bezoeken. Rechtsboven kun je via 'add event' naar de event creation pagina gaan.

### Event Creation

Op de event creation page kun je events aanmaken. Je geeft een locatienaam op en de optioneel de coördinaten. Ik raad echter aan om de knop erlangs te gebruiken om de locatie te vinden op de map waarna de coördinaten automatisch ingevuld worden op de creation page. Je kunt een titel toevoegen en een beschrijving. Je bent ook verplicht om je event te linken aan één van de groepen waar je lid van bent. Tenslotte voeg je een starttime toe en kun je optioneel een endtime toevoegen, anders is de endtime standaard een dag later dan de starttime. Als je het event succesvol hebt aangemaakt zal je automatisch worden aangewezen als de creator, dit geeft je extra rechten/mogelijkheden voor dat event, zoals info aanpassen, resources uploaden...

Alternatief kun je een event laten genereren door Shippy via 'ask Shippy'. Hierover zullen we later in meer detail gaan.

### EventView

Elk event heeft zijn eigen individuele eventpagina. Hier is alle informatie te zien: titel, creator, starttime & endtime, locatie die mits geldige coördinaten aanklikbaar is, beschrijving en de event status (planned, happenning now, ended, cancelled).

#### Attendees

Alle groepsleden kun voor een gelinkt event aangeven of ze gaan, gëintresseerd zijn of dat ze niet gaan. Je kunt dit aanduiden op de event page en opslaan. Via 'view attendees' open je een menu waarin je de attendance-status kunt zien van alle users die hiervoor al reeds een status hebben opgegeven.

#### Google calendar

Via de knop 'save to calendar' wordt je doorgestuurd naar google calender waar alle eveninfo automatisch is ingevuld.

#### Event edit

Als je de creator bent van het event zie je bovenaan de pagina 2 extra opties, de eerste is 'edit even', wat een menu opent waarin je zowat alle eventinformatie kunt aanpassen. Je kunt van hieruit ook events aflassen met 'cancel event' of het event volledig verwijderen via 'delete event'.

#### Externe bronnen

De tweede extra optie voor event creators is het uploaden van externe bronnen (resources). Dit opent een menu waarin je een afbeelding op je apparaat kunt selecteren en er een tag aan kunt geven. Na het uploaden is de resource zichtbaar op de event pagina onder het deel 'Resources'. Deze resources kunnen groter worden weergegeven door ze aan te klikken en ze kunnen ook gedownload worden. Het downloaden van deze resources kan ook offline.

#### pdf conversion

Via de 'download pdf' knop wordt alle eventinformatie omgezet naar een pdf bestand. Buiten de algemene info zijn er vanaf de 2e pagina van de pdf ook alle resources van het event te zien. Dit pdf formaat maakt het voor de gebruiker makkelijk om alle belangrijke eventinformatie af te drukken.

### Shippy

Shippy is onze ingebouwde eventfinder-bot. Je kunt Shippy vinden via de navbar of via de knop op de event creation pagina. Als gebruiker kan je aangeven waar je naar op zoek bent (hotel, restaurant, park ...) en een locatie waar je wilt zoeken. Shippy zal dan in de buurt zoeken naar hotels, restaurants etc aan de hand van wat je hebt gevraagd. Shippy zal steeds 1 tot 3 opties geven. Je kunt een optie kiezen, je wordt dan doorgestuurd naar de eventcreation pagina waar de eventinfo automatisch wordt ingevuld. Als je complete onzin ingeeft in de velden, of plaatsen die niet bestaan zoals Atlantis, zal Shippy even onzinnig terugreageren. Als Shippy namelijk niet weet wat er met de input moet gebeuren worden er 3 fallback opties weergegeven. typisch van de volgende vorm:

    Meet & greet at a popular aMeet & greet at a popular a.
    Suggestion generated from "a" near "b".
    b (approximate)

**Opgelet**: Shippy maakt gebruik van groq API (LLM) die op basis van de user input opties zoekt en deze in JSON formaat verder laat afhandelen door photon API om precieze coördinaten te krijgen. Het nadeel aan het gebruik van gratis API's is 1: dat de responses van de AI niet altijd even kwalitatief zijn en 2: dat photon soms gewoon niet operationeel is, op die momenten geeft Shippy altijd de default fallback. De efficiëntie van Shippy hangt dus hard af van de status van photon op eender welk moment. Achteraf gezien is deze feature dus niet zo stabiel en eerder een prove of concept dan een 100% werkende feature.

In de .env file zit ook de API key voor groq. Als er niks mis gaat zou die niet revoken of vervallen.

## Map

Bij het laden van de mappagina voor de eerste keer zal je gevraagd worden of je toestemming geeft voor het gebruiken van je locatie. De mappagina kan op basis van geolocatie je locatie bepalen en de map verplaatsen naar je huidige locatie. Bovenaan is er een zoekbalk waar je locaties kunt opzoeken. Er worden autocomplete opties voorzien via photon API. Net als op de Shippy pagina is de autocomplete afhankelijk van de beschikbaarheid van photon. Onder de searchbar zijn er verschillende opties. Checkboxes voor hotels, restaurants enzovoort zijn aanwezig. Op basis van wat er aangevinkt is zal er op de kaart met markers alle plaatsen aangeduid worden die aan je filters voldoen. Je kunt markers aanklikken voor meer informatie en je krijgt de keuze om op die locatie een event te creeëren. Als je dit doet wordt je doorgestuurd naar de event creation pagina waar de locatienaam en coördinaten automatisch zijn ingevuld.

## Offline

Één van de requirements was dat externe bronnen/resources ook offline vergrijgbaar zijn. Dit wordt ondersteund. Verder zijn alle andere features op de site ook offline volledig werkende buiten de map en Shippy, omdat deze externe api's gebruiken.

## Mobile

Ook op mobiele platformen zijn alle pagina's correct afgebeeld zodat alles leesbaar is. Met dank aan Merlijn voor de geweldige formatting!

## API's en externe libraries

better

### Browser API's

fetch, geolocatie, cookies

### Externe API's

Leaflet, openstreetmap, overpass API (voor map, het vinden van points of interest en queries kunnen uitvoeren op die points of interest)

Groq API (LLM voor Shippy)

Photon API (autocomplete searchbar map + coördinaten bepalen voor Shippy)

### Externe libs

better-sqlite3: backend dataopslag

Express: main framework

Cookie-parser: middleware om cookies te parsen

Dotenv: environment variables laden uit `.env` file

Multer: file upload middleware

Pdfkit: voor pdf conversion

## Opleisting uitbreidingen

We maken hier een onderscheid tussen de 2 'required' uitbreidingen die iets volledig nieuw implementeren en verschillende kleine uitbreidingen die niet expliciet vermeld waren, maar een logische volgende stap leken .

### 2 hoofduitbreidingen

Events genereren met Shippy

Events toevoegen aan Google Calender

### Extra uitbreidingen

Eventinfo kunnen aanpassen na het aanmaken van een event. Op algemene eventpagina kunnen filteren op eventstatus en op groep. Binnen een event een attendee-list waarin alle gebruikers kunnen aangeven of ze aanwezig zullen zijn of niet. Points of interest op map, ook met filters, points of interest zijn aanklikbaar en kunnen gebruikt worden als basis voor een event. Zoekbalk met autocomplete bij de map. Locatienamen met geldige coordinaten in een event zijn aanklikbaar en sturen je door naar de mappagina waar een marker de locatie van het event aanduid. Polls om te voten op verschillende events. Single-choice en multiple-choice polls zijn ondersteund. De chat en de pollvotes updaten live, dus aanpassingen/veranderingen zijn zichtbaar als meerdere instances runnen. Username kunnen aanpassen. Roles kunnen aanpassen. Login & account creation.

## Statement on AI usage

- AI werd gebruikt om syling (css) te voorzien zodat we meer konden focussen op de functionaliteit
- AI werd gebruikt om mee na te denken over de manier waarop we features konden implementeren. vb: "Waar in de groupchat pagina kan ik het best een polls feature toevoegen zodat dit niet te moeilijk te vinden is en tegelijk niet de focus weghaalt van de chat?" of "hoe kan ik het best images opslaan om ze ook offline te kunnen weergeven?"
- AI werd gebruikt voor debugging wanneer het probleem verscholen zat op een plaats die we niet konden vinden.
- AI werd gebruikt om te helpen met de implementatie van meerdere features, in het bijzonder voor het communiceren met externe API's.

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
