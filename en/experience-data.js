/* Curated journeys and factual stations; the product compass is deliberately local. */
(function(root){
  const journeys={
    ai:{name:"AI",topics:[8,9,10,15],intro:"From data and processes to products of my own.",stops:[
      {target:'selected-work',title:"AI in value creation",copy:"Technology starts with a concrete business process.",detail:2},
      {target:'expertise-ai',title:"Connecting systems",copy:"Thinking about AI agents, data architecture and automation together."},
      {target:'workshop',title:"Try it yourself",copy:"At Karriaro, this becomes a product world of its own.",product:'presence'},
      {target:'contact',title:"Starting a conversation",copy:"What connection would you like to create?"}]},
    leadership:{name:"Leadership",topics:[0,16,17,18],intro:"Connecting people, locations and responsibility.",stops:[
      {target:'about',title:"My perspective",copy:"For me, IT leadership and entrepreneurial thinking belong together."},
      {target:'expertise-leadership',title:"Setting a direction",copy:"Translating strategy into organisation and responsibility."},
      {target:'career-map',title:"Change perspectives",copy:"Places, roles and experiences across organisational boundaries."},
      {target:'contact',title:"Exchanging experiences",copy:"Let’s talk about your next challenge."}]},
    founder:{name:"Entrepreneurship",topics:[1,2,4,5],intro:"From business responsibility to founding my own venture.",stops:[
      {target:'selected-work',title:"Shaping a business",copy:"Thinking about digital business models from the perspective of a CDO and board member.",detail:3},
      {target:'experience',title:"Two perspectives",copy:"VP IT & Digital in my main role. Karriaro as my own family project."},
      {target:'workshop',title:"From idea to product",copy:"Four product lines at different stages of development.",product:'profile'},
      {target:'contact',title:"A next step",copy:"Ideas start with a good conversation."}]}
  };
  const career=[
    {id:'fh-koeln',years:'2000–2005',city:"Cologne",point:'cologne',role:"Business informatics degree",company:'Fachhochschule Köln',focus:"Graduated as Diplom-Informatiker (FH)."},
    {id:'ibm',years:'2005',city:'Düsseldorf',point:'dusseldorf',role:"Working student",company:'IBM Deutschland GmbH',focus:"Conceptual framework for my diploma thesis and further development within the project environment."},
    {id:'bechtle',years:'2005–2006',city:'Karlsruhe',point:'karlsruhe',role:'Junior Account Manager',company:'Bechtle AG',focus:"“Sales Force One” management trainee programme in sales. Established a new sales channel for IBM storage solutions."},
    {id:'bsh-2006',years:'2006–2010',city:"Munich",point:'munich',role:'Senior Business Intelligence Engineer',focus:"BI and analytics solutions, international BI rollouts, data models and ETL processes."},
    {id:'bsh-2011',years:'2011–2015',city:'Istanbul',point:'istanbul',role:'Head of Business Intelligence Competency Center',focus:"Established and led the BI Competency Center, global BI operations and SAP BI-to-HANA transformation (2013)."},
    {id:'bsh-2015',years:'2015–2017',city:"Munich",point:'munich',role:'Head of Enterprise Management HR solutions',focus:"Globally standardised SAP HCM solution, SAP SuccessFactors roadmap and rollout in China."},
    {id:'bsh-2017',years:'2017–2018',city:"Milan",point:'milan',role:'IT-Manager',focus:"Overall responsibility for local IT. E-commerce and EDI, ITIL processes and business intelligence."},
    {id:'bsh-2018',years:'2018–2019',city:'Istanbul',point:'istanbul',role:'Head of IT Factories Region T-MEA-CIS',focus:"Factory and supply chain IT: Industry 4.0, IoT and predictive maintenance, drone-based stocktaking (IDC Innovation Award)."},
    {id:'borusan',years:'2019–2021',city:'Istanbul',point:'istanbul',role:"Chief Digital Officer & Board Member",company:'Borusan Mannesmann',focus:"Responsibility for IT, R&D, supply chain and PMO. Digital strategy, ERP and cloud modernisation, Industry 4.0."},
    {id:'hansgrohe',years:"Since 2021",city:'Schiltach',point:'schiltach',role:'Vice President IT & Digital',company:'Hansgrohe SE',focus:"Global IT and digital strategy, delivery hubs in Türkiye and Asia, SAP S/4HANA (go-live May 2025). Embedding AI in value creation."},
    {id:'karriaro',years:"Since 2026 · alongside my main role",city:"Cologne",point:'cologne',role:"Founder",company:'Karriaro',focus:"Our own AI products. Self-funded and built as a family alongside our main careers."}
  ];
  const products={
    presence:{image:"/images/karriaro-webdesign-current.png",imageAlt:"Current Karriaro Webdesign homepage: websites with personality",imageCaption:"Karriaro Webdesign · Current website",name:'Karriaro-Webdesign',status:'Live',number:'01',reason:"You want to make your business visible. Here, I design and build individual websites and online shops.",url:"https://karriaro-webdesign.de/en",cta:"Explore web design",tags:['Website',"Visibility","AI tools"]},
    profile:{image:"/images/karriaro-folio-example.png",imageAlt:"Public Folio product view showing Muammer Kizilaslan’s profile",imageCaption:"Folio · My own profile as an example",name:'Karriaro-Folio',status:'Live',number:'02',reason:"Your expertise deserves a place of its own. Folio is for leaders who want their own digital profile.",url:'https://profil.karriaro.de/',cta:"Try Folio",tags:["Personal profile","Leaders","Your own website"]},
    visitors:{name:'Karriaro-Loupe',status:"In development",number:'03',reason:"You want to understand visits better. We are developing a visitor and lead dashboard; the product is still in development.",url:'https://karriaro.de/#linien',cta:"View development status",tags:["Visitor analytics",'Leads',"In development"]},
    property:{name:'Karriaro-Mesitara',status:"In pilot",number:'04',reason:"You work in property. Mesitara connects websites, CRM and mobile tools for estate agents and is currently being piloted.",url:'https://karriaro.de/#linien',cta:"Explore the pilot",tags:["Property",'CRM',"Mobile tools"]}
  };
  const locations={
    stuttgart:{name:'Stuttgart',lon:9.183,lat:48.776,note:{label:"Birthplace",title:"Swabian by birth.",focus:"Born in Stuttgart."}},
    cologne:{name:"Cologne",lon:6.960,lat:50.938},
    dusseldorf:{name:'Düsseldorf',lon:6.774,lat:51.228},
    karlsruhe:{name:'Karlsruhe',lon:8.404,lat:49.007},
    munich:{name:"Munich",lon:11.582,lat:48.135},
    milan:{name:"Milan",lon:9.190,lat:45.464},
    istanbul:{name:'Istanbul',lon:28.978,lat:41.008},
    schiltach:{name:'Schiltach',lon:8.341,lat:48.290}
  };
  career.forEach(s=>{if(!s.company)s.company='BSH Hausgeräte GmbH'});
  // Every place carries a dated role or a note (founder's CV, 20 September 2026). The list stays as the guard's escape hatch for future places.
  const openPlaces=[];
  const data={journeys,career,products,locations,openPlaces};
  if(typeof module!=='undefined'&&module.exports)module.exports=data;else root.ExperienceData=data;
})(typeof window!=='undefined'?window:this);
