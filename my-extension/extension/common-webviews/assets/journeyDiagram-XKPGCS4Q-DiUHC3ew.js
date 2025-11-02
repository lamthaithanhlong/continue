import{a as dt,g as ot,f as ft,d as gt}from"./chunk-TZMSLE5B--XT4X51-.js";import{g as mt}from"./chunk-FMBD7UC4-DyHbQPsW.js";import{_ as s,g as xt,s as kt,a as bt,b as _t,t as wt,q as vt,c as B,d as tt,e as $t,z as Mt}from"./AugmentMessage-BHgnxRkx.js";import{d as nt}from"./arc-BTMcSefQ.js";import"./TextAugment-CCgoKCVh.js";import"./index-B9uIMiyK.js";import"./preload-helper-iZIsTGZK.js";import"./await-Bft3-TRy.js";import"./index-B4NDmpYR.js";import"./IconButtonAugment-CsdawHyK.js";/* empty css                                                */import"./Store-CzuxPCq8.js";import"./CardAugment-Bqwu5ahx.js";import"./focusTrapStack-9JCo5vKi.js";import"./Chevron-Cl2ZClCm.js";import"./BaseTextInput-CKEk7GUD.js";import"./message-broker-CppRv-qk.js";import"./index-BuNY6jLF.js";import"./index-Bz1AJAWu.js";import"./chat-model-DaVfYv7o.js";import"./file-type-utils-CBkYZ4gj.js";import"./CalloutAugment-BUb-HAQ6.js";import"./types-DGsjtdxm.js";import"./chat-model-context-DwFUhpQk.js";import"./Markdown-F1hzawoT.js";import"./CollapseButtonAugment-CdECN-QQ.js";import"./toggleHighContrast-BIKVVoPO.js";import"./ButtonAugment-dm8Gq3Cq.js";import"./Filespan-DQTy5qup.js";import"./OpenFileButton-DcM9qoQQ.js";import"./index-Czcl53hR.js";import"./remote-agents-client-3ykFyqEs.js";import"./SuccessfulButton-CqblPP5m.js";import"./CopyButton-CYoKSKPU.js";import"./LanguageIcon-BRHvdy0u.js";import"./keypress-fD7XHdyk.js";import"./TextAreaAugment-Pjr5jpcU.js";import"./partner-mcp-utils-8KSbNsEE.js";import"./augment-logo-CnRinIIJ.js";import"./utils-BOGwHecm.js";try{F=typeof window<"u"?window:typeof global<"u"?global:typeof globalThis<"u"?globalThis:typeof self<"u"?self:{},(Q=new F.Error().stack)&&(F._sentryDebugIds=F._sentryDebugIds||{},F._sentryDebugIds[Q]="7178409e-d0c1-4be0-a3c9-d4c4405a78ec",F._sentryDebugIdIdentifier="sentry-dbid-7178409e-d0c1-4be0-a3c9-d4c4405a78ec")}catch{}var F,Q,X=function(){var t=s(function(l,e,r,p){for(r=r||{},p=l.length;p--;r[l[p]]=e);return r},"o"),n=[6,8,10,11,12,14,16,17,18],o=[1,9],h=[1,10],i=[1,11],c=[1,12],y=[1,13],u=[1,14],f={trace:s(function(){},"trace"),yy:{},symbols_:{error:2,start:3,journey:4,document:5,EOF:6,line:7,SPACE:8,statement:9,NEWLINE:10,title:11,acc_title:12,acc_title_value:13,acc_descr:14,acc_descr_value:15,acc_descr_multiline_value:16,section:17,taskName:18,taskData:19,$accept:0,$end:1},terminals_:{2:"error",4:"journey",6:"EOF",8:"SPACE",10:"NEWLINE",11:"title",12:"acc_title",13:"acc_title_value",14:"acc_descr",15:"acc_descr_value",16:"acc_descr_multiline_value",17:"section",18:"taskName",19:"taskData"},productions_:[0,[3,3],[5,0],[5,2],[7,2],[7,1],[7,1],[7,1],[9,1],[9,2],[9,2],[9,1],[9,1],[9,2]],performAction:s(function(l,e,r,p,d,a,k){var x=a.length-1;switch(d){case 1:return a[x-1];case 2:case 6:case 7:this.$=[];break;case 3:a[x-1].push(a[x]),this.$=a[x-1];break;case 4:case 5:this.$=a[x];break;case 8:p.setDiagramTitle(a[x].substr(6)),this.$=a[x].substr(6);break;case 9:this.$=a[x].trim(),p.setAccTitle(this.$);break;case 10:case 11:this.$=a[x].trim(),p.setAccDescription(this.$);break;case 12:p.addSection(a[x].substr(8)),this.$=a[x].substr(8);break;case 13:p.addTask(a[x-1],a[x]),this.$="task"}},"anonymous"),table:[{3:1,4:[1,2]},{1:[3]},t(n,[2,2],{5:3}),{6:[1,4],7:5,8:[1,6],9:7,10:[1,8],11:o,12:h,14:i,16:c,17:y,18:u},t(n,[2,7],{1:[2,1]}),t(n,[2,3]),{9:15,11:o,12:h,14:i,16:c,17:y,18:u},t(n,[2,5]),t(n,[2,6]),t(n,[2,8]),{13:[1,16]},{15:[1,17]},t(n,[2,11]),t(n,[2,12]),{19:[1,18]},t(n,[2,4]),t(n,[2,9]),t(n,[2,10]),t(n,[2,13])],defaultActions:{},parseError:s(function(l,e){if(!e.recoverable){var r=new Error(l);throw r.hash=e,r}this.trace(l)},"parseError"),parse:s(function(l){var e=this,r=[0],p=[],d=[null],a=[],k=this.table,x="",E=0,P=0,pt=a.slice.call(arguments,1),b=Object.create(this.lexer),C={yy:{}};for(var Y in this.yy)Object.prototype.hasOwnProperty.call(this.yy,Y)&&(C.yy[Y]=this.yy[Y]);b.setInput(l,C.yy),C.yy.lexer=b,C.yy.parser=this,b.yylloc===void 0&&(b.yylloc={});var q=b.yylloc;a.push(q);var yt=b.options&&b.options.ranges;function H(){var v;return typeof(v=p.pop()||b.lex()||1)!="number"&&(v instanceof Array&&(v=(p=v).pop()),v=e.symbols_[v]||v),v}typeof C.yy.parseError=="function"?this.parseError=C.yy.parseError:this.parseError=Object.getPrototypeOf(this).parseError,s(function(v){r.length=r.length-2*v,d.length=d.length-v,a.length=a.length-v},"popStack"),s(H,"lex");for(var _,A,w,Z,O,T,J,N,j={};;){if(A=r[r.length-1],this.defaultActions[A]?w=this.defaultActions[A]:(_==null&&(_=H()),w=k[A]&&k[A][_]),w===void 0||!w.length||!w[0]){var K="";for(O in N=[],k[A])this.terminals_[O]&&O>2&&N.push("'"+this.terminals_[O]+"'");K=b.showPosition?"Parse error on line "+(E+1)+`:
`+b.showPosition()+`
Expecting `+N.join(", ")+", got '"+(this.terminals_[_]||_)+"'":"Parse error on line "+(E+1)+": Unexpected "+(_==1?"end of input":"'"+(this.terminals_[_]||_)+"'"),this.parseError(K,{text:b.match,token:this.terminals_[_]||_,line:b.yylineno,loc:q,expected:N})}if(w[0]instanceof Array&&w.length>1)throw new Error("Parse Error: multiple actions possible at state: "+A+", token: "+_);switch(w[0]){case 1:r.push(_),d.push(b.yytext),a.push(b.yylloc),r.push(w[1]),_=null,P=b.yyleng,x=b.yytext,E=b.yylineno,q=b.yylloc;break;case 2:if(T=this.productions_[w[1]][1],j.$=d[d.length-T],j._$={first_line:a[a.length-(T||1)].first_line,last_line:a[a.length-1].last_line,first_column:a[a.length-(T||1)].first_column,last_column:a[a.length-1].last_column},yt&&(j._$.range=[a[a.length-(T||1)].range[0],a[a.length-1].range[1]]),(Z=this.performAction.apply(j,[x,P,E,C.yy,w[1],d,a].concat(pt)))!==void 0)return Z;T&&(r=r.slice(0,-1*T*2),d=d.slice(0,-1*T),a=a.slice(0,-1*T)),r.push(this.productions_[w[1]][0]),d.push(j.$),a.push(j._$),J=k[r[r.length-2]][r[r.length-1]],r.push(J);break;case 3:return!0}}return!0},"parse")},g=function(){var l={EOF:1,parseError:s(function(e,r){if(!this.yy.parser)throw new Error(e);this.yy.parser.parseError(e,r)},"parseError"),setInput:s(function(e,r){return this.yy=r||this.yy||{},this._input=e,this._more=this._backtrack=this.done=!1,this.yylineno=this.yyleng=0,this.yytext=this.matched=this.match="",this.conditionStack=["INITIAL"],this.yylloc={first_line:1,first_column:0,last_line:1,last_column:0},this.options.ranges&&(this.yylloc.range=[0,0]),this.offset=0,this},"setInput"),input:s(function(){var e=this._input[0];return this.yytext+=e,this.yyleng++,this.offset++,this.match+=e,this.matched+=e,e.match(/(?:\r\n?|\n).*/g)?(this.yylineno++,this.yylloc.last_line++):this.yylloc.last_column++,this.options.ranges&&this.yylloc.range[1]++,this._input=this._input.slice(1),e},"input"),unput:s(function(e){var r=e.length,p=e.split(/(?:\r\n?|\n)/g);this._input=e+this._input,this.yytext=this.yytext.substr(0,this.yytext.length-r),this.offset-=r;var d=this.match.split(/(?:\r\n?|\n)/g);this.match=this.match.substr(0,this.match.length-1),this.matched=this.matched.substr(0,this.matched.length-1),p.length-1&&(this.yylineno-=p.length-1);var a=this.yylloc.range;return this.yylloc={first_line:this.yylloc.first_line,last_line:this.yylineno+1,first_column:this.yylloc.first_column,last_column:p?(p.length===d.length?this.yylloc.first_column:0)+d[d.length-p.length].length-p[0].length:this.yylloc.first_column-r},this.options.ranges&&(this.yylloc.range=[a[0],a[0]+this.yyleng-r]),this.yyleng=this.yytext.length,this},"unput"),more:s(function(){return this._more=!0,this},"more"),reject:s(function(){return this.options.backtrack_lexer?(this._backtrack=!0,this):this.parseError("Lexical error on line "+(this.yylineno+1)+`. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).
`+this.showPosition(),{text:"",token:null,line:this.yylineno})},"reject"),less:s(function(e){this.unput(this.match.slice(e))},"less"),pastInput:s(function(){var e=this.matched.substr(0,this.matched.length-this.match.length);return(e.length>20?"...":"")+e.substr(-20).replace(/\n/g,"")},"pastInput"),upcomingInput:s(function(){var e=this.match;return e.length<20&&(e+=this._input.substr(0,20-e.length)),(e.substr(0,20)+(e.length>20?"...":"")).replace(/\n/g,"")},"upcomingInput"),showPosition:s(function(){var e=this.pastInput(),r=new Array(e.length+1).join("-");return e+this.upcomingInput()+`
`+r+"^"},"showPosition"),test_match:s(function(e,r){var p,d,a;if(this.options.backtrack_lexer&&(a={yylineno:this.yylineno,yylloc:{first_line:this.yylloc.first_line,last_line:this.last_line,first_column:this.yylloc.first_column,last_column:this.yylloc.last_column},yytext:this.yytext,match:this.match,matches:this.matches,matched:this.matched,yyleng:this.yyleng,offset:this.offset,_more:this._more,_input:this._input,yy:this.yy,conditionStack:this.conditionStack.slice(0),done:this.done},this.options.ranges&&(a.yylloc.range=this.yylloc.range.slice(0))),(d=e[0].match(/(?:\r\n?|\n).*/g))&&(this.yylineno+=d.length),this.yylloc={first_line:this.yylloc.last_line,last_line:this.yylineno+1,first_column:this.yylloc.last_column,last_column:d?d[d.length-1].length-d[d.length-1].match(/\r?\n?/)[0].length:this.yylloc.last_column+e[0].length},this.yytext+=e[0],this.match+=e[0],this.matches=e,this.yyleng=this.yytext.length,this.options.ranges&&(this.yylloc.range=[this.offset,this.offset+=this.yyleng]),this._more=!1,this._backtrack=!1,this._input=this._input.slice(e[0].length),this.matched+=e[0],p=this.performAction.call(this,this.yy,this,r,this.conditionStack[this.conditionStack.length-1]),this.done&&this._input&&(this.done=!1),p)return p;if(this._backtrack){for(var k in a)this[k]=a[k];return!1}return!1},"test_match"),next:s(function(){if(this.done)return this.EOF;var e,r,p,d;this._input||(this.done=!0),this._more||(this.yytext="",this.match="");for(var a=this._currentRules(),k=0;k<a.length;k++)if((p=this._input.match(this.rules[a[k]]))&&(!r||p[0].length>r[0].length)){if(r=p,d=k,this.options.backtrack_lexer){if((e=this.test_match(p,a[k]))!==!1)return e;if(this._backtrack){r=!1;continue}return!1}if(!this.options.flex)break}return r?(e=this.test_match(r,a[d]))!==!1&&e:this._input===""?this.EOF:this.parseError("Lexical error on line "+(this.yylineno+1)+`. Unrecognized text.
`+this.showPosition(),{text:"",token:null,line:this.yylineno})},"next"),lex:s(function(){var e=this.next();return e||this.lex()},"lex"),begin:s(function(e){this.conditionStack.push(e)},"begin"),popState:s(function(){return this.conditionStack.length-1>0?this.conditionStack.pop():this.conditionStack[0]},"popState"),_currentRules:s(function(){return this.conditionStack.length&&this.conditionStack[this.conditionStack.length-1]?this.conditions[this.conditionStack[this.conditionStack.length-1]].rules:this.conditions.INITIAL.rules},"_currentRules"),topState:s(function(e){return(e=this.conditionStack.length-1-Math.abs(e||0))>=0?this.conditionStack[e]:"INITIAL"},"topState"),pushState:s(function(e){this.begin(e)},"pushState"),stateStackSize:s(function(){return this.conditionStack.length},"stateStackSize"),options:{"case-insensitive":!0},performAction:s(function(e,r,p,d){switch(p){case 0:case 1:case 3:case 4:break;case 2:return 10;case 5:return 4;case 6:return 11;case 7:return this.begin("acc_title"),12;case 8:return this.popState(),"acc_title_value";case 9:return this.begin("acc_descr"),14;case 10:return this.popState(),"acc_descr_value";case 11:this.begin("acc_descr_multiline");break;case 12:this.popState();break;case 13:return"acc_descr_multiline_value";case 14:return 17;case 15:return 18;case 16:return 19;case 17:return":";case 18:return 6;case 19:return"INVALID"}},"anonymous"),rules:[/^(?:%(?!\{)[^\n]*)/i,/^(?:[^\}]%%[^\n]*)/i,/^(?:[\n]+)/i,/^(?:\s+)/i,/^(?:#[^\n]*)/i,/^(?:journey\b)/i,/^(?:title\s[^#\n;]+)/i,/^(?:accTitle\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*\{\s*)/i,/^(?:[\}])/i,/^(?:[^\}]*)/i,/^(?:section\s[^#:\n;]+)/i,/^(?:[^#:\n;]+)/i,/^(?::[^#\n;]+)/i,/^(?::)/i,/^(?:$)/i,/^(?:.)/i],conditions:{acc_descr_multiline:{rules:[12,13],inclusive:!1},acc_descr:{rules:[10],inclusive:!1},acc_title:{rules:[8],inclusive:!1},INITIAL:{rules:[0,1,2,3,4,5,6,7,9,11,14,15,16,17,18,19],inclusive:!0}}};return l}();function m(){this.yy={}}return f.lexer=g,s(m,"Parser"),m.prototype=f,f.Parser=m,new m}();X.parser=X;var Tt=X,V="",G=[],D=[],L=[],St=s(function(){G.length=0,D.length=0,V="",L.length=0,Mt()},"clear"),It=s(function(t){V=t,G.push(t)},"addSection"),Et=s(function(){return G},"getSections"),Ct=s(function(){let t=et(),n=0;for(;!t&&n<100;)t=et(),n++;return D.push(...L),D},"getTasks"),At=s(function(){const t=[];return D.forEach(n=>{n.people&&t.push(...n.people)}),[...new Set(t)].sort()},"updateActors"),Pt=s(function(t,n){const o=n.substr(1).split(":");let h=0,i=[];o.length===1?(h=Number(o[0]),i=[]):(h=Number(o[0]),i=o[1].split(","));const c=i.map(u=>u.trim()),y={section:V,type:V,people:c,task:t,score:h};L.push(y)},"addTask"),jt=s(function(t){const n={section:V,type:V,description:t,task:t,classes:[]};D.push(n)},"addTaskOrg"),et=s(function(){const t=s(function(o){return L[o].processed},"compileTask");let n=!0;for(const[o,h]of L.entries())t(o),n=n&&h.processed;return n},"compileTasks"),Ft=s(function(){return At()},"getActors"),it={getConfig:s(()=>B().journey,"getConfig"),clear:St,setDiagramTitle:vt,getDiagramTitle:wt,setAccTitle:_t,getAccTitle:bt,setAccDescription:kt,getAccDescription:xt,addSection:It,getSections:Et,getTasks:Ct,addTask:Pt,addTaskOrg:jt,getActors:Ft},Vt=s(t=>`.label {
    font-family: ${t.fontFamily};
    color: ${t.textColor};
  }
  .mouth {
    stroke: #666;
  }

  line {
    stroke: ${t.textColor}
  }

  .legend {
    fill: ${t.textColor};
    font-family: ${t.fontFamily};
  }

  .label text {
    fill: #333;
  }
  .label {
    color: ${t.textColor}
  }

  .face {
    ${t.faceColor?`fill: ${t.faceColor}`:"fill: #FFF8DC"};
    stroke: #999;
  }

  .node rect,
  .node circle,
  .node ellipse,
  .node polygon,
  .node path {
    fill: ${t.mainBkg};
    stroke: ${t.nodeBorder};
    stroke-width: 1px;
  }

  .node .label {
    text-align: center;
  }
  .node.clickable {
    cursor: pointer;
  }

  .arrowheadPath {
    fill: ${t.arrowheadColor};
  }

  .edgePath .path {
    stroke: ${t.lineColor};
    stroke-width: 1.5px;
  }

  .flowchart-link {
    stroke: ${t.lineColor};
    fill: none;
  }

  .edgeLabel {
    background-color: ${t.edgeLabelBackground};
    rect {
      opacity: 0.5;
    }
    text-align: center;
  }

  .cluster rect {
  }

  .cluster text {
    fill: ${t.titleColor};
  }

  div.mermaidTooltip {
    position: absolute;
    text-align: center;
    max-width: 200px;
    padding: 2px;
    font-family: ${t.fontFamily};
    font-size: 12px;
    background: ${t.tertiaryColor};
    border: 1px solid ${t.border2};
    border-radius: 2px;
    pointer-events: none;
    z-index: 100;
  }

  .task-type-0, .section-type-0  {
    ${t.fillType0?`fill: ${t.fillType0}`:""};
  }
  .task-type-1, .section-type-1  {
    ${t.fillType0?`fill: ${t.fillType1}`:""};
  }
  .task-type-2, .section-type-2  {
    ${t.fillType0?`fill: ${t.fillType2}`:""};
  }
  .task-type-3, .section-type-3  {
    ${t.fillType0?`fill: ${t.fillType3}`:""};
  }
  .task-type-4, .section-type-4  {
    ${t.fillType0?`fill: ${t.fillType4}`:""};
  }
  .task-type-5, .section-type-5  {
    ${t.fillType0?`fill: ${t.fillType5}`:""};
  }
  .task-type-6, .section-type-6  {
    ${t.fillType0?`fill: ${t.fillType6}`:""};
  }
  .task-type-7, .section-type-7  {
    ${t.fillType0?`fill: ${t.fillType7}`:""};
  }

  .actor-0 {
    ${t.actor0?`fill: ${t.actor0}`:""};
  }
  .actor-1 {
    ${t.actor1?`fill: ${t.actor1}`:""};
  }
  .actor-2 {
    ${t.actor2?`fill: ${t.actor2}`:""};
  }
  .actor-3 {
    ${t.actor3?`fill: ${t.actor3}`:""};
  }
  .actor-4 {
    ${t.actor4?`fill: ${t.actor4}`:""};
  }
  .actor-5 {
    ${t.actor5?`fill: ${t.actor5}`:""};
  }
  ${mt()}
`,"getStyles"),U=s(function(t,n){return gt(t,n)},"drawRect"),Bt=s(function(t,n){const h=t.append("circle").attr("cx",n.cx).attr("cy",n.cy).attr("class","face").attr("r",15).attr("stroke-width",2).attr("overflow","visible"),i=t.append("g");function c(f){const g=nt().startAngle(Math.PI/2).endAngle(Math.PI/2*3).innerRadius(7.5).outerRadius(6.8181818181818175);f.append("path").attr("class","mouth").attr("d",g).attr("transform","translate("+n.cx+","+(n.cy+2)+")")}function y(f){const g=nt().startAngle(3*Math.PI/2).endAngle(Math.PI/2*5).innerRadius(7.5).outerRadius(6.8181818181818175);f.append("path").attr("class","mouth").attr("d",g).attr("transform","translate("+n.cx+","+(n.cy+7)+")")}function u(f){f.append("line").attr("class","mouth").attr("stroke",2).attr("x1",n.cx-5).attr("y1",n.cy+7).attr("x2",n.cx+5).attr("y2",n.cy+7).attr("class","mouth").attr("stroke-width","1px").attr("stroke","#666")}return i.append("circle").attr("cx",n.cx-5).attr("cy",n.cy-5).attr("r",1.5).attr("stroke-width",2).attr("fill","#666").attr("stroke","#666"),i.append("circle").attr("cx",n.cx+5).attr("cy",n.cy-5).attr("r",1.5).attr("stroke-width",2).attr("fill","#666").attr("stroke","#666"),s(c,"smile"),s(y,"sad"),s(u,"ambivalent"),n.score>3?c(i):n.score<3?y(i):u(i),h},"drawFace"),lt=s(function(t,n){const o=t.append("circle");return o.attr("cx",n.cx),o.attr("cy",n.cy),o.attr("class","actor-"+n.pos),o.attr("fill",n.fill),o.attr("stroke",n.stroke),o.attr("r",n.r),o.class!==void 0&&o.attr("class",o.class),n.title!==void 0&&o.append("title").text(n.title),o},"drawCircle"),ct=s(function(t,n){return ft(t,n)},"drawText"),Dt=s(function(t,n){function o(i,c,y,u,f){return i+","+c+" "+(i+y)+","+c+" "+(i+y)+","+(c+u-f)+" "+(i+y-1.2*f)+","+(c+u)+" "+i+","+(c+u)}s(o,"genPoints");const h=t.append("polygon");h.attr("points",o(n.x,n.y,50,20,7)),h.attr("class","labelBox"),n.y=n.y+n.labelMargin,n.x=n.x+.5*n.labelMargin,ct(t,n)},"drawLabel"),Lt=s(function(t,n,o){const h=t.append("g"),i=ot();i.x=n.x,i.y=n.y,i.fill=n.fill,i.width=o.width*n.taskCount+o.diagramMarginX*(n.taskCount-1),i.height=o.height,i.class="journey-section section-type-"+n.num,i.rx=3,i.ry=3,U(h,i),ht(o)(n.text,h,i.x,i.y,i.width,i.height,{class:"journey-section section-type-"+n.num},o,n.colour)},"drawSection"),st=-1,Rt=s(function(t,n,o){const h=n.x+o.width/2,i=t.append("g");st++,i.append("line").attr("id","task"+st).attr("x1",h).attr("y1",n.y).attr("x2",h).attr("y2",450).attr("class","task-line").attr("stroke-width","1px").attr("stroke-dasharray","4 2").attr("stroke","#666"),Bt(i,{cx:h,cy:300+30*(5-n.score),score:n.score});const c=ot();c.x=n.x,c.y=n.y,c.fill=n.fill,c.width=o.width,c.height=o.height,c.class="task task-type-"+n.num,c.rx=3,c.ry=3,U(i,c);let y=n.x+14;n.people.forEach(u=>{const f=n.actors[u].color,g={cx:y,cy:n.y,r:7,fill:f,stroke:"#000",title:u,pos:n.actors[u].position};lt(i,g),y+=10}),ht(o)(n.task,i,c.x,c.y,c.width,c.height,{class:"task"},o,n.colour)},"drawTask"),Ot=s(function(t,n){dt(t,n)},"drawBackgroundRect"),ht=function(){function t(i,c,y,u,f,g,m,l){h(c.append("text").attr("x",y+f/2).attr("y",u+g/2+5).style("font-color",l).style("text-anchor","middle").text(i),m)}function n(i,c,y,u,f,g,m,l,e){const{taskFontSize:r,taskFontFamily:p}=l,d=i.split(/<br\s*\/?>/gi);for(let a=0;a<d.length;a++){const k=a*r-r*(d.length-1)/2,x=c.append("text").attr("x",y+f/2).attr("y",u).attr("fill",e).style("text-anchor","middle").style("font-size",r).style("font-family",p);x.append("tspan").attr("x",y+f/2).attr("dy",k).text(d[a]),x.attr("y",u+g/2).attr("dominant-baseline","central").attr("alignment-baseline","central"),h(x,m)}}function o(i,c,y,u,f,g,m,l){const e=c.append("switch"),r=e.append("foreignObject").attr("x",y).attr("y",u).attr("width",f).attr("height",g).attr("position","fixed").append("xhtml:div").style("display","table").style("height","100%").style("width","100%");r.append("div").attr("class","label").style("display","table-cell").style("text-align","center").style("vertical-align","middle").text(i),n(i,e,y,u,f,g,m,l),h(r,m)}function h(i,c){for(const y in c)y in c&&i.attr(y,c[y])}return s(t,"byText"),s(n,"byTspan"),s(o,"byFo"),s(h,"_setTextAttrs"),function(i){return i.textPlacement==="fo"?o:i.textPlacement==="old"?t:n}}(),R={drawRect:U,drawCircle:lt,drawSection:Lt,drawText:ct,drawLabel:Dt,drawTask:Rt,drawBackgroundRect:Ot,initGraphics:s(function(t){t.append("defs").append("marker").attr("id","arrowhead").attr("refX",5).attr("refY",2).attr("markerWidth",6).attr("markerHeight",4).attr("orient","auto").append("path").attr("d","M 0,0 V 4 L6,2 Z")},"initGraphics")},Nt=s(function(t){Object.keys(t).forEach(function(n){M[n]=t[n]})},"setConf"),S={},z=0;function ut(t){const n=B().journey,o=n.maxLabelWidth;z=0;let h=60;Object.keys(S).forEach(i=>{const c=S[i].color,y={cx:20,cy:h,r:7,fill:c,stroke:"#000",pos:S[i].position};R.drawCircle(t,y);let u=t.append("text").attr("visibility","hidden").text(i);const f=u.node().getBoundingClientRect().width;u.remove();let g=[];if(f<=o)g=[i];else{const m=i.split(" ");let l="";u=t.append("text").attr("visibility","hidden"),m.forEach(e=>{const r=l?`${l} ${e}`:e;if(u.text(r),u.node().getBoundingClientRect().width>o){if(l&&g.push(l),l=e,u.text(e),u.node().getBoundingClientRect().width>o){let p="";for(const d of e)p+=d,u.text(p+"-"),u.node().getBoundingClientRect().width>o&&(g.push(p.slice(0,-1)+"-"),p=d);l=p}}else l=r}),l&&g.push(l),u.remove()}g.forEach((m,l)=>{const e={x:40,y:h+7+20*l,fill:"#666",text:m,textMargin:n.boxTextMargin??5},r=R.drawText(t,e).node().getBoundingClientRect().width;r>z&&r>n.leftMargin-r&&(z=r)}),h+=Math.max(20,20*g.length)})}s(ut,"drawActorLegend");var M=B().journey,I=0,zt=s(function(t,n,o,h){const i=B(),c=i.journey.titleColor,y=i.journey.titleFontSize,u=i.journey.titleFontFamily,f=i.securityLevel;let g;f==="sandbox"&&(g=tt("#i"+n));const m=tt(f==="sandbox"?g.nodes()[0].contentDocument.body:"body");$.init();const l=m.select("#"+n);R.initGraphics(l);const e=h.db.getTasks(),r=h.db.getDiagramTitle(),p=h.db.getActors();for(const P in S)delete S[P];let d=0;p.forEach(P=>{S[P]={color:M.actorColours[d%M.actorColours.length],position:d},d++}),ut(l),I=M.leftMargin+z,$.insert(0,0,I,50*Object.keys(S).length),Yt(l,e,0);const a=$.getBounds();r&&l.append("text").text(r).attr("x",I).attr("font-size",y).attr("font-weight","bold").attr("y",25).attr("fill",c).attr("font-family",u);const k=a.stopy-a.starty+2*M.diagramMarginY,x=I+a.stopx+2*M.diagramMarginX;$t(l,k,x,M.useMaxWidth),l.append("line").attr("x1",I).attr("y1",4*M.height).attr("x2",x-I-4).attr("y2",4*M.height).attr("stroke-width",4).attr("stroke","black").attr("marker-end","url(#arrowhead)");const E=r?70:0;l.attr("viewBox",`${a.startx} -25 ${x} ${k+E}`),l.attr("preserveAspectRatio","xMinYMin meet"),l.attr("height",k+E+25)},"draw"),$={data:{startx:void 0,stopx:void 0,starty:void 0,stopy:void 0},verticalPos:0,sequenceItems:[],init:s(function(){this.sequenceItems=[],this.data={startx:void 0,stopx:void 0,starty:void 0,stopy:void 0},this.verticalPos=0},"init"),updateVal:s(function(t,n,o,h){t[n]===void 0?t[n]=o:t[n]=h(o,t[n])},"updateVal"),updateBounds:s(function(t,n,o,h){const i=B().journey,c=this;let y=0;function u(f){return s(function(g){y++;const m=c.sequenceItems.length-y+1;c.updateVal(g,"starty",n-m*i.boxMargin,Math.min),c.updateVal(g,"stopy",h+m*i.boxMargin,Math.max),c.updateVal($.data,"startx",t-m*i.boxMargin,Math.min),c.updateVal($.data,"stopx",o+m*i.boxMargin,Math.max),f!=="activation"&&(c.updateVal(g,"startx",t-m*i.boxMargin,Math.min),c.updateVal(g,"stopx",o+m*i.boxMargin,Math.max),c.updateVal($.data,"starty",n-m*i.boxMargin,Math.min),c.updateVal($.data,"stopy",h+m*i.boxMargin,Math.max))},"updateItemBounds")}s(u,"updateFn"),this.sequenceItems.forEach(u())},"updateBounds"),insert:s(function(t,n,o,h){const i=Math.min(t,o),c=Math.max(t,o),y=Math.min(n,h),u=Math.max(n,h);this.updateVal($.data,"startx",i,Math.min),this.updateVal($.data,"starty",y,Math.min),this.updateVal($.data,"stopx",c,Math.max),this.updateVal($.data,"stopy",u,Math.max),this.updateBounds(i,y,c,u)},"insert"),bumpVerticalPos:s(function(t){this.verticalPos=this.verticalPos+t,this.data.stopy=this.verticalPos},"bumpVerticalPos"),getVerticalPos:s(function(){return this.verticalPos},"getVerticalPos"),getBounds:s(function(){return this.data},"getBounds")},W=M.sectionFills,rt=M.sectionColours,Yt=s(function(t,n,o){const h=B().journey;let i="";const c=o+(2*h.height+h.diagramMarginY);let y=0,u="#CCC",f="black",g=0;for(const[m,l]of n.entries()){if(i!==l.section){u=W[y%W.length],g=y%W.length,f=rt[y%rt.length];let r=0;const p=l.section;for(let a=m;a<n.length&&n[a].section==p;a++)r+=1;const d={x:m*h.taskMargin+m*h.width+I,y:50,text:l.section,fill:u,num:g,colour:f,taskCount:r};R.drawSection(t,d,h),i=l.section,y++}const e=l.people.reduce((r,p)=>(S[p]&&(r[p]=S[p]),r),{});l.x=m*h.taskMargin+m*h.width+I,l.y=c,l.width=h.diagramMarginX,l.height=h.diagramMarginY,l.colour=f,l.fill=u,l.num=g,l.actors=e,R.drawTask(t,l,h),$.insert(l.x,l.y,l.x+l.width+h.taskMargin,450)}},"drawTasks"),at={setConf:Nt,draw:zt},An={parser:Tt,db:it,renderer:at,styles:Vt,init:s(t=>{at.setConf(t.journey),it.clear()},"init")};export{An as diagram};
//# sourceMappingURL=journeyDiagram-XKPGCS4Q-DiUHC3ew.js.map
