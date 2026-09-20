/* Curated journeys and factual stations; the product compass is deliberately local. */
(function(root){
  const journeys={
    ai:{name:'KI',topics:[8,9,10,15],intro:'Von Daten und Prozessen zu eigenen Produkten.',stops:[
      {target:'selected-work',title:'KI in der Wertschöpfung',copy:'Technologie beginnt beim konkreten Geschäftsprozess.',detail:2},
      {target:'expertise-ai',title:'Systeme verbinden',copy:'KI-Agenten, Datenarchitektur und Automatisierung zusammendenken.'},
      {target:'workshop',title:'Selbst ausprobieren',copy:'Bei Karriaro wird aus dem Thema eine eigene Produktwelt.',product:'presence'},
      {target:'contact',title:'Ins Gespräch kommen',copy:'Welche Verbindung möchten Sie schaffen?'}]},
    leadership:{name:'Führung',topics:[0,16,17,18],intro:'Menschen, Standorte und Verantwortung verbinden.',stops:[
      {target:'about',title:'Meine Perspektive',copy:'IT-Führung und unternehmerisches Denken gehören für mich zusammen.'},
      {target:'expertise-leadership',title:'Richtung geben',copy:'Strategie in Organisation und Verantwortung übersetzen.'},
      {target:'career-map',title:'Perspektiven wechseln',copy:'Orte, Rollen und Erfahrungen über Unternehmensgrenzen hinweg.'},
      {target:'contact',title:'Erfahrungen austauschen',copy:'Lassen Sie uns über Ihre nächste Aufgabe sprechen.'}]},
    founder:{name:'Unternehmertum',topics:[1,2,4,5],intro:'Von unternehmerischer Verantwortung zur eigenen Gründung.',stops:[
      {target:'selected-work',title:'Unternehmerisch gestalten',copy:'Digitale Geschäftsmodelle aus der Verantwortung eines CDO und Vorstands heraus denken.',detail:3},
      {target:'experience',title:'Zwei Perspektiven',copy:'VP IT & Digital im Hauptberuf. Karriaro als eigenes Familienprojekt.'},
      {target:'workshop',title:'Vom Gedanken zum Produkt',copy:'Vier Produktlinien mit unterschiedlichen Entwicklungsständen.',product:'profile'},
      {target:'contact',title:'Ein nächster Schritt',copy:'Ideen beginnen mit einem guten Gespräch.'}]}
  };
  const career=[
    {id:'fh-koeln',years:'2000–2005',city:'Köln',point:'cologne',role:'Studium der Wirtschaftsinformatik',company:'Fachhochschule Köln',focus:'Abschluss als Diplom-Informatiker (FH).'},
    {id:'ibm',years:'2005',city:'Düsseldorf',point:'dusseldorf',role:'Werkstudent',company:'IBM Deutschland GmbH',focus:'Konzeptioneller Rahmen für die Diplomarbeit, weiterführende Entwicklungen im Projektumfeld.'},
    {id:'bechtle',years:'2005–2006',city:'Karlsruhe',point:'karlsruhe',role:'Junior Account Manager',company:'Bechtle AG',focus:'Management-Trainee-Programm „Sales Force One“ im Vertrieb. Aufbau eines neuen Vertriebskanals für IBM-Speicherlösungen.'},
    {id:'bsh-2006',years:'2006–2010',city:'München',point:'munich',role:'Senior Business Intelligence Engineer',focus:'BI- und Analytics-Lösungen, internationale BI-Rollouts, Datenmodelle und ETL-Prozesse.'},
    {id:'bsh-2011',years:'2011–2015',city:'Istanbul',point:'istanbul',role:'Head of Business Intelligence Competency Center',focus:'Aufbau und Leitung des BI-Kompetenzzentrums, globaler BI-Betrieb, SAP-BI-zu-HANA-Transformation (2013).'},
    {id:'bsh-2015',years:'2015–2017',city:'München',point:'munich',role:'Head of Enterprise Management HR solutions',focus:'Weltweit einheitliche SAP-HCM-Lösung, SAP-SuccessFactors-Roadmap, Rollout in China.'},
    {id:'bsh-2017',years:'2017–2018',city:'Mailand',point:'milan',role:'IT-Manager',focus:'Gesamtverantwortung für die lokale IT. E-Commerce und EDI, ITIL-Prozesse, Business Intelligence.'},
    {id:'bsh-2018',years:'2018–2019',city:'Istanbul',point:'istanbul',role:'Head of IT Factories Region T-MEA-CIS',focus:'Fabrik- und Supply-Chain-IT: Industrie 4.0, IoT und Predictive Maintenance, drohnengestützte Inventur (IDC Innovation Award).'},
    {id:'borusan',years:'2019–2021',city:'Istanbul',point:'istanbul',role:'Chief Digital Officer & Vorstandsmitglied',company:'Borusan Mannesmann',focus:'Verantwortung für IT, F&E, Supply Chain und PMO. Digitalstrategie, ERP- und Cloud-Modernisierung, Industrie 4.0.'},
    {id:'hansgrohe',years:'Seit 2021',city:'Schiltach',point:'schiltach',role:'Vice President IT & Digital',company:'Hansgrohe SE',focus:'Globale IT- und Digitalstrategie, Delivery Hubs in der Türkei und Asien, SAP S/4HANA (Go-live Mai 2025). KI in der Wertschöpfung verankern.'},
    {id:'karriaro',years:'Seit 2026 · parallel',city:'Köln',point:'cologne',role:'Gründer',company:'Karriaro',focus:'Eigene KI-Produkte. Eigenfinanziert und gemeinsam als Familie neben dem Hauptberuf aufgebaut.'}
  ];
  const products={
    presence:{image:'images/karriaro-webdesign-example.jpg',imageAlt:'Webdesign-Beispiel Stadtmakler Stuttgart aus dem Karriaro-Portfolio',imageCaption:'Webdesign · Beispiel Stadtmakler Stuttgart',name:'Karriaro-Webdesign',status:'Live',number:'01',reason:'Sie möchten als Unternehmen sichtbar werden. Diese Produktlinie verbindet den Webauftritt mit KI-Werkzeugen.',url:'https://karriaro-webdesign.de/',cta:'Webdesign entdecken',tags:['Website','Sichtbarkeit','KI-Werkzeuge']},
    profile:{image:'images/karriaro-folio-example.png',imageAlt:'Öffentliche Folio-Produktansicht mit dem Profil von Muammer Kizilaslan',imageCaption:'Folio · Beispiel meines eigenen Profils',name:'Karriaro-Folio',status:'Live',number:'02',reason:'Ihre persönliche Expertise soll einen eigenen Ort bekommen. Folio richtet sich an Führungskräfte mit einem eigenen digitalen Profil.',url:'https://profil.karriaro.de/',cta:'Folio ausprobieren',tags:['Persönliches Profil','Führungskräfte','Eigene Website']},
    visitors:{name:'Karriaro-Loupe',status:'In Entwicklung',number:'03',reason:'Sie möchten Besuche besser verstehen. Dafür entsteht ein Besucher- und Lead-Cockpit; das Produkt ist noch in Entwicklung.',url:'https://karriaro.de/#linien',cta:'Entwicklungsstand ansehen',tags:['Besuchsanalyse','Leads','In Entwicklung']},
    property:{name:'Karriaro-Mesitara',status:'Im Pilot',number:'04',reason:'Ihr Alltag dreht sich um Immobilien. Mesitara verbindet Website, CRM und mobile Werkzeuge für Makler und wird im Pilot erprobt.',url:'https://karriaro.de/#linien',cta:'Pilot kennenlernen',tags:['Immobilien','CRM','Mobile Werkzeuge']}
  };
  const locations={
    stuttgart:{name:'Stuttgart',lon:9.183,lat:48.776,note:{label:'Geburtsort',title:'Gebürtiger Schwabe.',focus:'In Stuttgart geboren.'}},
    cologne:{name:'Köln',lon:6.960,lat:50.938},
    dusseldorf:{name:'Düsseldorf',lon:6.774,lat:51.228},
    karlsruhe:{name:'Karlsruhe',lon:8.404,lat:49.007},
    munich:{name:'München',lon:11.582,lat:48.135},
    milan:{name:'Mailand',lon:9.190,lat:45.464},
    istanbul:{name:'Istanbul',lon:28.978,lat:41.008},
    schiltach:{name:'Schiltach',lon:8.341,lat:48.290}
  };
  career.forEach(s=>{if(!s.company)s.company='BSH Hausgeräte GmbH'});
  // Every place carries a dated role or a note (founder's CV, 20 September 2026). The list stays as the guard's escape hatch for future places.
  const openPlaces=[];
  const data={journeys,career,products,locations,openPlaces};
  if(typeof module!=='undefined'&&module.exports)module.exports=data;else root.ExperienceData=data;
})(typeof window!=='undefined'?window:this);
