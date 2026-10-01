// Genera los wireframes (HTML) y los exporta a PNG con Playwright.
// Uso: NODE_PATH=$(npm root -g) node wireframes/src/build.js
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const OUT = path.join(__dirname, '..');
const M = n => `<span class="mark">${n}</span>`;

const MENUS = {
  direccion: ['Panel principal','Estudiantes','Profesores','Trabajos de grado y prácticas','Solicitudes','Alertas','Reportes','Bitácora'],
  profesor:  ['Panel principal','Mis tutorados','Tutorías','Trabajos que dirijo','Prácticas que asesoro','Alertas'],
  estudiante:['Mi panel','Mi perfil','Mis solicitudes','Mis tutorías','Actividades interdisciplinares','Trabajo de grado'],
};
const ROL = { direccion:'Dirección', profesor:'Profesor(a)', estudiante:'Estudiante' };

function page({ code, title, rol, user, active, body, notes, url }) {
  const menu = MENUS[rol].map(m => `<a class="${m===active?'on':''}">${m}</a>`).join('');
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${code} ${title}</title>
<link rel="stylesheet" href="wf.css"></head><body>
<div style="position:relative">
 <div class="unal-top">
  <div class="unal-logo"><div class="unal-escudo">ESCUDO</div>
   <div class="unal-word"><b>UNIVERSIDAD</b><b>NACIONAL</b><span>DE COLOMBIA</span></div></div>
  <div class="unal-links"><span>Sedes ▾</span><span>Correo</span><span>SIA</span><span>Biblioteca</span><span class="ico"></span><span class="ico"></span></div>
  <div class="wf-tag">${code} · ${title}</div>
 </div>
 <div class="unal-strip"><span class="sede">Sede Manizales</span><span>Facultad de Administración</span><span>Programa: Administración de Sistemas Informáticos</span><span style="margin-left:auto;text-transform:none;color:#aaa">${url}</span></div>
 <div class="app-bar"><span class="name">☆ Trayectoria Estudiantil ASI <small>Sistema de seguimiento a estudiantes</small></span>
  <div class="user"><div class="bell">🔔<i>${rol==='estudiante'?2:rol==='profesor'?3:14}</i></div><div class="avatar"></div>
   <div><b>${user}</b><br><span class="pill dark">Rol: ${ROL[rol]}</span></div><span class="btn">Cerrar sesión</span></div></div>
 <div class="layout"><nav class="side"><h6>MENÚ</h6>${menu}<div class="sep"></div><a>Ayuda</a><a>Mi cuenta</a></nav>
  <main class="main">${body}</main></div>
 <div class="notes"><h4>Notas de diseño (no forman parte de la interfaz)</h4><ol>${notes.map((n,i)=>`<li>${M(i+1)}<span>${n}</span></li>`).join('')}</ol></div>
 <div class="unal-foot"><div><b>Universidad Nacional de Colombia</b>Sede Manizales · Campus La Nubia<br>Manizales, Caldas</div>
  <div><b>Contacto</b>Dirección de programa ASI<br>Atención en línea</div><div><b>Régimen legal</b>Política de tratamiento de datos personales<br>Ley 1581 de 2012</div>
  <div class="gov"><span></span><span></span><span></span></div></div>
</div></body></html>`;
}

const pages = [];

/* ---------- WF-01 Página principal (Dirección) ---------- */
pages.push({ file:'wf01-pagina-principal', code:'WF-01', title:'Página principal', rol:'direccion', user:'Nombre Director(a)', active:'Panel principal', url:'trayectoria-asi.unal.edu.co/panel',
body:`<div class="crumb">Inicio › Panel principal</div>
<div style="display:flex;align-items:flex-end"><div><h1>Panel principal</h1><div class="sub">Resumen general del programa · Periodo <b>2026-2S</b></div></div>
<div style="margin-left:auto;display:flex;gap:8px;align-items:center">${M(1)}<div class="input sel" style="width:150px">Periodo 2026-2S</div></div></div>
<div class="row" style="margin-bottom:18px">${M(2)}
 <div class="kpi"><b>312</b><span>Estudiantes activos</span></div>
 <div class="kpi"><b>14</b><span>Alertas pendientes de revisión</span></div>
 <div class="kpi"><b>9</b><span>Solicitudes sin resolver</span></div>
 <div class="kpi"><b>47</b><span>Tutorías registradas en el periodo</span></div>
 <div class="kpi"><b>23</b><span>Estudiantes sin tutor asignado</span></div></div>
<div class="row"><div class="col" style="flex:2.2">
 <div class="card"><h3>${M(3)} Alertas recientes <span class="right"><a class="link">Ver todas las alertas →</a></span></h3>
 <table><tr><th>Estudiante</th><th>Tipo de alerta</th><th>Generada</th><th>Tutor actual</th><th>Estado</th><th>Acción</th></tr>
 <tr><td>Gabriela Cutiva</td><td>Problemas económicos</td><td>28/09/2026</td><td>Prof. Nombre</td><td><span class="pill warn">Pendiente</span></td><td><span class="btn sm">Revisar</span></td></tr>
 <tr><td>Oswin Cuaran</td><td>Sin matrícula</td><td>27/09/2026</td><td>Prof. Nombre</td><td><span class="pill warn">Pendiente</span></td><td><span class="btn sm">Revisar</span></td></tr>
 <tr><td>Johan Ocoro</td><td>Solicitudes recurrentes</td><td>25/09/2026</td><td>Prof. Nombre</td><td><span class="pill warn">Pendiente</span></td><td><span class="btn sm">Revisar</span></td></tr>
 <tr class="hl"><td>Nombre Apellido</td><td>Bajo avance de carrera</td><td>24/09/2026</td><td><i style="color:#c33">Sin tutor</i> ${M(4)}</td><td><span class="pill warn">Pendiente</span></td><td><span class="btn sm">Asignar tutor</span></td></tr></table></div>
 <div class="card"><h3>${M(5)} Solicitudes pendientes <span class="right"><a class="link">Ver todas →</a></span></h3>
 <table><tr><th>Estudiante</th><th>Tipo</th><th>Radicada</th><th>Días en espera</th><th>Soportes</th><th>Estado</th><th>Acción</th></tr>
 <tr><td>Nombre Apellido</td><td>Homologación de asignaturas</td><td>22/09/2026</td><td>9</td><td>📎 2</td><td><span class="pill warn">Pendiente</span></td><td><span class="btn sm">Resolver</span></td></tr>
 <tr><td>Nombre Apellido</td><td>Carga mínima</td><td>20/09/2026</td><td>11</td><td>📎 1</td><td><span class="pill warn">Pendiente</span></td><td><span class="btn sm">Resolver</span></td></tr>
 <tr><td>Nombre Apellido</td><td>Cancelación de semestre</td><td>18/09/2026</td><td><b>13</b></td><td>📎 3</td><td><span class="pill bad">Vencida</span></td><td><span class="btn sm">Resolver</span></td></tr></table></div>
</div><div class="col">
 <div class="card"><h3>${M(6)} Accesos rápidos</h3>
  <span class="btn pri block">⇪ Cargar estudiantes activos (archivo SIA)</span><span class="btn block">Registrar trabajo de grado</span><span class="btn block">Registrar práctica</span><span class="btn block">Asignar tutor</span><span class="btn block">Ver reportes</span>
  <div class="help">Última carga del archivo institucional: 15/09/2026 · 312 registros</div></div>
 <div class="card"><h3>Estudiantes por avance de carrera</h3><div class="ph" style="height:150px"></div><div class="help">Gráfico de barras (0–25 %, 25–50 %, 50–75 %, 75–100 %)</div></div>
</div></div>`,
notes:['El selector de periodo filtra todo el panel; por defecto muestra el periodo académico vigente.',
'Indicadores clave del programa. Cada tarjeta es clicable y lleva al listado ya filtrado (p. ej. «Alertas pendientes» → WF-02 con filtro de alertas).',
'Las alertas se ordenan por fecha de generación; «Revisar» abre la alerta en la ficha del estudiante (tabla ALERTA, campo id_usuario_revisa).',
'Se resalta al estudiante sin tutor vigente (TUTOR_ASIGNADO sin fecha_fin). La acción contextual cambia a «Asignar tutor».',
'Las solicitudes muestran los días en espera y el número de soportes adjuntos (SOPORTE). Si superan el plazo se marcan como «Vencida».',
'Accesos rápidos solo para el rol Dirección. La carga del archivo del SIA actualiza la tabla ESTUDIANTE (PAPA, avance, matrículas).']});

/* ---------- WF-02 Listado de estudiantes ---------- */
const est = [
 ['1.054.xxx.101','Gabriela Cutiva','8','78 %','4.1','Prof. A. Gómez','2','ok'],
 ['1.054.xxx.102','Oswin Cuaran','5','41 %','3.2','Prof. L. Ruiz','1','warn'],
 ['1.054.xxx.103','Johan Ocoro','6','52 %','3.6','Prof. A. Gómez','1','warn'],
 ['1.054.xxx.104','Nombre Apellido','3','18 %','2.9','—','3','bad'],
 ['1.054.xxx.105','Nombre Apellido','9','92 %','4.4','Prof. M. Díaz','0','ok'],
 ['1.054.xxx.106','Nombre Apellido','4','33 %','3.8','Prof. L. Ruiz','0','ok'],
 ['1.054.xxx.107','Nombre Apellido','7','65 %','3.4','Prof. M. Díaz','0','ok'],
 ['1.054.xxx.108','Nombre Apellido','2','12 %','3.9','Prof. A. Gómez','0','ok'],
 ['1.054.xxx.109','Nombre Apellido','10','97 %','4.0','Prof. M. Díaz','0','ok'],
 ['1.054.xxx.110','Nombre Apellido','5','45 %','3.1','Prof. L. Ruiz','1','warn'],
];
pages.push({ file:'wf02-listado-estudiantes', code:'WF-02', title:'Listado de estudiantes', rol:'direccion', user:'Nombre Director(a)', active:'Estudiantes', url:'trayectoria-asi.unal.edu.co/estudiantes',
body:`<div class="crumb">Inicio › Estudiantes</div>
<div style="display:flex;align-items:flex-end;margin-bottom:14px"><div><h1>Estudiantes</h1><div class="sub" style="margin:0">312 estudiantes activos · Periodo 2026-2S</div></div>
<div style="margin-left:auto;display:flex;gap:8px">${M(6)}<span class="btn">⇩ Exportar (Excel)</span><span class="btn pri">⇪ Cargar archivo SIA</span></div></div>
<div class="card"><h3>${M(1)} Búsqueda y filtros</h3>
<div class="row" style="gap:12px"><div class="field" style="flex:2"><label>Buscar</label><div class="input">🔍 Documento, nombre o correo…</div></div>
<div class="field col"><label>Estado</label><div class="input sel">Activo</div></div>
<div class="field col"><label>Tutor actual</label><div class="input sel">Todos</div></div>
<div class="field col"><label>Tipo de acceso</label><div class="input sel">Todos</div></div>
<div class="field col"><label>Subacceso</label><div class="input sel">Todos</div></div></div>
<div class="row" style="gap:12px;align-items:flex-end"><div class="field col"><label>PAPA</label><div class="input">desde 0.0 — hasta 5.0</div></div>
<div class="field col"><label>Avance de carrera</label><div class="input">desde 0 % — hasta 100 %</div></div>
<div class="field col"><label>Estrato</label><div class="input sel">Todos</div></div>
<div class="field col"><label>Con alertas</label><div class="input sel">Solo con alertas pendientes</div></div>
<div class="field" style="display:flex;gap:8px"><span class="btn pri">Aplicar</span><span class="btn">Limpiar</span></div></div>
<div>${M(2)}<span class="chip">Estado: Activo ✕</span><span class="chip">Con alertas pendientes ✕</span></div></div>
<div class="card"><h3>Resultados <span class="right">Mostrando 1–10 de 37 · Ordenar por: <b>Alertas ▾</b></span></h3>
<table><tr><th><input type="checkbox"></th><th>Documento ▲▼</th><th>Nombre ▲▼</th><th>Matrículas</th><th>Avance ${M(3)}</th><th>PAPA ▲▼</th><th>Tutor actual</th><th>Alertas ${M(4)}</th><th>Acciones ${M(5)}</th></tr>
${est.map(e=>`<tr class="${e[5]==='—'?'hl':''}"><td><input type="checkbox"></td><td>${e[0]}</td><td><a class="link" style="font-size:13px">${e[1]}</a></td><td>${e[2]}</td>
<td><div style="display:flex;align-items:center;gap:6px"><div class="bar" style="width:80px"><i style="width:${e[3].replace(" ","")}"></i></div>${e[3]}</div></td><td>${e[4]}</td>
<td>${e[5]==='—'?'<i style="color:#c33">Sin tutor</i>':e[5]}</td><td><span class="pill ${e[7]}">${e[6]}</span></td><td><span class="btn sm">Ver ficha</span> <span class="btn sm">⋯</span></td></tr>`).join('')}
</table>
<div style="display:flex;align-items:center;margin-top:12px"><span>Con seleccionados: <span class="btn sm">Asignar tutor</span> <span class="btn sm">Exportar</span></span>
<span style="margin-left:auto">« ‹ <b class="pill dark">1</b> <span class="pill">2</span> <span class="pill">3</span> <span class="pill">4</span> › » &nbsp; 10 por página ▾</span></div></div>`,
notes:['Búsqueda libre (documento, nombre o correo) más filtros basados en los atributos de ESTUDIANTE, SUBACCESO/ACCESO y TUTOR_ASIGNADO.',
'Los filtros activos se muestran como «chips» que se pueden quitar uno a uno. La URL guarda los filtros para poder compartir la consulta.',
'El avance de carrera se muestra con una barra para poder comparar de un vistazo.',
'Las alertas se colorean por severidad: verde (0), amarillo (1–2), rojo (3 o más o sin tutor). Por defecto se ordena por alertas.',
'«Ver ficha» abre WF-03. El menú ⋯ ofrece: asignar tutor, registrar tutoría y generar alerta manual.',
'Exportar y Cargar archivo SIA solo aparecen para el rol Dirección. El profesor ve este listado restringido a «Mis tutorados».']});

/* ---------- WF-03 Ficha del estudiante (vista Profesor-tutor) ---------- */
pages.push({ file:'wf03-ficha-estudiante', code:'WF-03', title:'Ficha del estudiante', rol:'profesor', user:'Prof. A. Gómez', active:'Mis tutorados', url:'trayectoria-asi.unal.edu.co/estudiantes/1054xxx101',
body:`<div class="crumb">Inicio › Mis tutorados › Gabriela Cutiva</div>
<div class="card" style="display:flex;gap:18px;align-items:center">${M(1)}<div class="ph" style="width:84px;height:84px;border-radius:50%"></div>
<div style="flex:1"><h1 style="margin:0">Gabriela Cutiva</h1><div class="sub" style="margin:2px 0 8px">C.C. 1.054.xxx.101 · gcutiva@unal.edu.co · Manizales</div>
<span class="pill ok">Activo</span> <span class="pill">Acceso: PAES – Mejores bachilleres</span> <span class="pill">Tutor actual: Prof. A. Gómez (desde 2025-1S)</span></div>
<div style="display:flex;flex-direction:column;gap:8px">${M(2)}<span class="btn pri">+ Registrar tutoría</span><span class="btn">⚑ Generar alerta</span><span class="btn">⇩ Descargar ficha (PDF)</span></div></div>
<div class="row" style="margin-bottom:18px">${M(3)}
<div class="kpi"><b>4.1</b><span>PAPA</span></div><div class="kpi"><b>3.9</b><span>Promedio del periodo</span></div>
<div class="kpi"><b>78 %</b><span>Avance de carrera</span><div class="bar" style="margin-top:6px"><i style="width:78%"></i></div></div>
<div class="kpi"><b>8</b><span>Matrículas</span></div><div class="kpi"><b>2</b><span>Alertas pendientes</span></div></div>
<div class="tabs">${M(4)}<span class="on">Resumen</span><span>Datos personales</span><span>Perfil académico</span><span class="lock">🔒 Perfil psicosocial</span><span>Tutorías</span><span>Trabajo de grado</span><span>Prácticas</span><span>Actividades</span><span>Solicitudes</span><span>Alertas</span></div>
<div class="row"><div class="col">
<div class="card"><h3>Datos generales</h3><dl class="kv">
<dt>Fecha de nacimiento</dt><dd>12/03/2004 (22 años)</dd><dt>Sexo legal / Género</dt><dd>Femenino / Mujer</dd>
<dt>Estrato</dt><dd>2</dd><dt>PBM</dt><dd>14</dd><dt>Teléfono</dt><dd>300 xxx xxxx</dd><dt>Dirección</dt><dd>Cra. xx # xx-xx</dd>
<dt>Colegio</dt><dd>I.E. Nombre (Público) · grado 2020</dd><dt>Saber 11 / Admisión</dt><dd>356 / 712,4 (puesto 18)</dd></dl></div>
<div class="card"><h3>${M(5)} Historial de tutores</h3><table><tr><th>Profesor</th><th>Inicio</th><th>Fin</th></tr>
<tr><td><b>Prof. A. Gómez</b></td><td>2025-1S</td><td><span class="pill ok">Vigente</span></td></tr><tr><td>Prof. L. Ruiz</td><td>2023-1S</td><td>2024-2S</td></tr></table></div>
</div><div class="col">
<div class="card"><h3>${M(6)} Alertas activas</h3>
<div style="border-left:4px solid #c9a400;padding:6px 10px;margin-bottom:8px"><b>Problemas económicos</b> · 28/09/2026<br><span class="help">Generada automáticamente: estrato ≤ 2 y PBM ≤ 15 sin apoyo registrado</span><br><span class="btn sm" style="margin-top:6px">Marcar como revisada</span> <span class="btn sm">Registrar acción</span></div>
<div style="border-left:4px solid #c9a400;padding:6px 10px"><b>Solicitudes recurrentes</b> · 25/09/2026<br><span class="help">3 solicitudes en el periodo</span></div></div>
<div class="card"><h3>Línea de tiempo <span class="right"><a class="link">Ver todo →</a></span></h3>
<div style="border-left:2px solid #999;padding-left:14px;line-height:1.9">
<div>● <b>29/09/2026</b> Tutoría individual (presencial)</div><div>● <b>22/09/2026</b> Radicó solicitud: Homologación</div>
<div>● <b>10/08/2026</b> Inicia práctica en Empresa XYZ</div><div>● <b>02/06/2026</b> Tutoría grupal (virtual)</div><div>● <b>15/05/2026</b> Participación en semillero de investigación</div></div></div>
</div></div>`,
notes:['Encabezado fijo con la identificación del estudiante y su tutor vigente, visible en todas las pestañas.',
'Acciones permitidas al rol Profesor-tutor. «Registrar tutoría» abre el formulario con el estudiante ya seleccionado.',
'Indicadores académicos cargados desde el SIA (papa, prom_actual, avance_carrera, matriculas).',
'Las pestañas siguen las entidades del modelo (PERFIL_ACADÉMICO, TUTORÍA, TRABAJO_GRADO, PRÁCTICA…). El perfil psicosocial y las patologías son datos sensibles: solo los ve Dirección o el tutor vigente si el estudiante dio su consentimiento (Ley 1581).',
'El historial sale de TUTOR_ASIGNADO. El tutor vigente es el registro sin fecha_fin.',
'Las alertas se pueden marcar como revisadas desde la ficha, lo que guarda id_usuario_revisa y fecha_revision. Cada acción queda en BITÁCORA.']});

/* ---------- WF-04 Formulario: Radicar solicitud (Estudiante) ---------- */
pages.push({ file:'wf04-formulario-solicitud', code:'WF-04', title:'Formulario – Radicar solicitud', rol:'estudiante', user:'Gabriela Cutiva', active:'Mis solicitudes', url:'trayectoria-asi.unal.edu.co/solicitudes/nueva',
body:`<div class="crumb">Inicio › Mis solicitudes › Nueva solicitud</div><h1>Radicar solicitud</h1><div class="sub">La Dirección del programa responderá por este medio y por correo institucional.</div>
<div class="steps">${M(1)}<div class="done">1. Tipo de solicitud ✓</div><div class="on">2. Detalle y soportes</div><div>3. Confirmación</div></div>
<div class="row"><div class="col" style="flex:2"><div class="card">
<div class="row"><div class="field col"><label>Tipo de solicitud <em>*</em></label><div class="input sel" style="color:#333">Homologación de asignaturas</div></div>
<div class="field col"><label>Fecha de radicación</label><div class="input" style="background:#eee">01/10/2026 (automática)</div></div></div>
<div class="field"><label>Datos del solicitante ${M(2)}</label><div class="input" style="background:#eee;color:#555">Gabriela Cutiva · C.C. 1.054.xxx.101 · gcutiva@unal.edu.co</div></div>
<div class="field"><label>Descripción de la solicitud <em>*</em> ${M(3)}</label><div class="input area">Describa qué solicita y por qué…</div><div class="help">Mínimo 30 caracteres · 0/1000</div></div>
<div class="field"><label>Soportes ${M(4)}</label><div class="drop">⇪ Arrastre aquí los archivos o <u>selecciónelos</u><br><span class="help">PDF, JPG o PNG · máximo 5 MB por archivo · hasta 5 archivos</span></div>
<table style="margin-top:10px"><tr><th>Archivo</th><th>Tipo de soporte</th><th>Tamaño</th><th></th></tr>
<tr><td>📄 certificado_notas.pdf</td><td><div class="input sel" style="height:28px;color:#333">Certificado de notas</div></td><td>820 KB</td><td>✕</td></tr>
<tr><td>📄 contenido_programatico.pdf</td><td><div class="input sel" style="height:28px">Seleccione…</div><div class="help" style="color:#c33">Seleccione el tipo de soporte</div></td><td>1,4 MB</td><td>✕</td></tr></table></div>
<div class="field"><label><input type="checkbox" checked> Autorizo el tratamiento de mis datos personales según la política de la Universidad <em>*</em></label></div>
<div style="display:flex;gap:10px;justify-content:flex-end;border-top:1px solid #ddd;padding-top:14px">${M(5)}<span class="btn">‹ Anterior</span><span class="btn">Guardar borrador</span><span class="btn pri">Continuar a confirmación ›</span></div>
</div></div>
<div class="col"><div class="card"><h3>${M(6)} Requisitos para este tipo</h3><ul style="padding-left:18px;line-height:1.8">
<li>Certificado de notas de la institución de origen</li><li>Contenido programático de cada asignatura</li><li>Plazo de respuesta: 15 días hábiles</li></ul></div>
<div class="card"><h3>Mis solicitudes recientes</h3><table><tr><th>Tipo</th><th>Estado</th></tr><tr><td>Carga mínima</td><td><span class="pill ok">Resuelta</span></td></tr><tr><td>Cancelación de asignatura</td><td><span class="pill warn">En estudio</span></td></tr></table></div></div></div>`,
notes:['Formulario por pasos para que el estudiante sepa en qué etapa va y no se pierda.',
'Los datos del solicitante se toman de la sesión (id_documento) y no se pueden editar, lo que evita errores.',
'Los campos obligatorios llevan *. La validación se hace al salir de cada campo y los errores aparecen junto al campo.',
'Varios soportes por solicitud (entidad débil SOPORTE: nombre_archivo + tipo_soporte + ruta + fecha_carga).',
'Se puede guardar un borrador. Al confirmar, la solicitud queda «Pendiente» y se notifica a Dirección (id_usuario_resuelve vacío).',
'El panel lateral cambia según el tipo elegido y muestra los soportes requeridos, para reducir solicitudes incompletas.']});

/* ---------- WF-05 Vista consolidada: Reportes ---------- */
const bars = (vals,lbls)=>`<div style="display:flex;align-items:flex-end;gap:14px;height:150px;border-left:1px solid #999;border-bottom:1px solid #999;padding:0 10px">${vals.map((v,i)=>`<div style="flex:1;text-align:center"><div style="height:${v}px;background:#${['555','777','999','bbb','666','888'][i%6]}"></div><div class="help">${lbls[i]}</div></div>`).join('')}</div>`;
pages.push({ file:'wf05-vista-consolidada', code:'WF-05', title:'Vista consolidada – Reportes', rol:'direccion', user:'Nombre Director(a)', active:'Reportes', url:'trayectoria-asi.unal.edu.co/reportes',
body:`<div class="crumb">Inicio › Reportes</div>
<div style="display:flex;align-items:flex-end;margin-bottom:14px"><div><h1>Reporte consolidado del programa</h1><div class="sub" style="margin:0">Información agregada para comités y acreditación</div></div>
<div style="margin-left:auto;display:flex;gap:8px">${M(6)}<span class="btn">⇩ PDF</span><span class="btn">⇩ Excel</span></div></div>
<div class="card" style="display:flex;gap:12px;align-items:flex-end">${M(1)}
<div class="field col" style="margin:0"><label>Periodo</label><div class="input sel" style="color:#333">2026-2S</div></div>
<div class="field col" style="margin:0"><label>Cohorte de ingreso</label><div class="input sel">Todas</div></div>
<div class="field col" style="margin:0"><label>Tipo de acceso</label><div class="input sel">Todos</div></div>
<div class="field col" style="margin:0"><label>Comparar con</label><div class="input sel">2026-1S</div></div><span class="btn pri">Generar</span></div>
<div class="row" style="margin-bottom:18px">${M(2)}
<div class="kpi"><b>312</b><span>Activos (▲ 4 % vs 2026-1S)</span></div><div class="kpi"><b>3.72</b><span>PAPA promedio</span></div>
<div class="kpi"><b>6,4 %</b><span>Deserción del periodo</span></div><div class="kpi"><b>86 %</b><span>Estudiantes con tutor vigente</span></div><div class="kpi"><b>11 días</b><span>Tiempo medio de respuesta a solicitudes</span></div></div>
<div class="row"><div class="card col"><h3>${M(3)} Estudiantes por tipo de acceso</h3>${bars([130,70,40,25],['Regular','PAES','PEAMA','Otros'])}</div>
<div class="card col"><h3>Alertas por tipo (pendientes / revisadas)</h3>${bars([90,60,45,35,20],['Económicas','Sin matrícula','Bajo avance','PAPA < 3.0','Solicitudes'])}</div>
<div class="card col"><h3>Trabajos de grado por modalidad</h3>${bars([110,80,50],['Trabajo de grado','Práctica','Posgrado'])}</div></div>
<div class="row"><div class="card" style="flex:2"><h3>${M(4)} Consolidado por cohorte</h3>
<table><tr><th>Cohorte</th><th>Admitidos</th><th>Activos</th><th>PAPA prom.</th><th>Avance prom.</th><th>Tutorías</th><th>Alertas</th><th>Graduados</th></tr>
<tr><td>2022-1S</td><td>60</td><td>41</td><td>3.81</td><td>88 %</td><td>96</td><td>7</td><td>9</td></tr>
<tr><td>2023-1S</td><td>62</td><td>50</td><td>3.70</td><td>66 %</td><td>112</td><td>12</td><td>—</td></tr>
<tr><td>2024-1S</td><td>65</td><td>57</td><td>3.65</td><td>45 %</td><td>130</td><td>15</td><td>—</td></tr>
<tr><td>2025-1S</td><td>70</td><td>66</td><td>3.74</td><td>24 %</td><td>88</td><td>9</td><td>—</td></tr>
<tr style="font-weight:700"><td>Total</td><td>257</td><td>214</td><td>3.72</td><td>—</td><td>426</td><td>43</td><td>9</td></tr></table></div>
<div class="card col"><h3>${M(5)} Prácticas por sector</h3><div class="ph" style="height:150px;border-radius:50%;width:150px;margin:0 auto"></div>
<div class="help" style="text-align:center;margin-top:8px">Gráfico circular: Tecnología · Financiero · Público · Otros</div></div></div>`,
notes:['Los filtros globales (periodo, cohorte, acceso) recalculan todos los bloques. La opción «Comparar con» agrega la variación frente a otro periodo.',
'Indicadores agregados para la toma de decisiones de la Dirección y para los informes de autoevaluación y acreditación.',
'Cada gráfico permite hacer clic en una barra para bajar al listado WF-02 ya filtrado.',
'La tabla por cohorte cruza ESTUDIANTE, TUTORÍA, ALERTA y TRABAJO_GRADO. Las columnas se pueden ordenar.',
'Distribución de PRÁCTICA por EMPRESA.sector.',
'La exportación a PDF o Excel queda registrada en BITÁCORA (acción «exportar_reporte»). Solo está disponible para el rol Dirección.']});

(async () => {
  for (const p of pages) fs.writeFileSync(path.join(__dirname, p.file + '.html'), page(p));
  const browser = await chromium.launch();
  const pg = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5 });
  for (const p of pages) {
    await pg.goto('file://' + path.join(__dirname, p.file + '.html'));
    await pg.screenshot({ path: path.join(OUT, p.file + '.png'), fullPage: true });
    console.log('ok', p.file);
  }
  await browser.close();
})();
