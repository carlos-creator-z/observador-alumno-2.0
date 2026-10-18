// ==========================================
// Importaciones
// ==========================================
const Observacion = require('../models/Observacion');
const Usuario = require('../models/Usuario');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');


// ==========================================
// LÓGICA DE OBSERVACIONES (API)
// ==========================================

// Crear observación (Con validación de grado para profesores)
exports.createObservacion = async (req, res) => {
  try {
    const { 
      alumno, 
      tipo, 
      categoria, 
      descripcion, 
      fechaHecho, 
      firmaDocente 
    } = req.body;
    
    // Validar permisos si el usuario es profesor
    if (req.user.rol === 'profesor') {
      const alumnoData = await Usuario.findById(alumno).select('grado');
      
      if (!alumnoData) {
        return res.status(404).json({ message: 'Alumno no encontrado' });
      }
      
      if (!req.user.grados || !req.user.grados.includes(alumnoData.grado)) {
        return res.status(403).json({ 
          message: 'No tienes permiso para observar a este alumno' 
        });
      }
    }

    // Crear la nueva observación
    const nueva = await Observacion.create({ 
      alumno, 
      registradoPor: req.user.id, 
      tipo, 
      categoria, 
      descripcion, 
      fechaHecho,
      firmaDocente: firmaDocente || null
    });
    
    res.status(201).json(nueva);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error al crear observación', 
      error: error.message 
    });
  }
};


// Ver observaciones del alumno logueado
exports.getMyObservaciones = async (req, res) => {
  try {
    const obs = await Observacion.find({ alumno: req.user.id })
      .populate('registradoPor', 'nombre apellido')
      .sort({ createdAt: -1 });
      
    res.json(obs);
  } catch (error) { 
    res.status(500).json({ message: 'Error del servidor' }); 
  }
};


// Obtener observaciones hechas por el profesor/admin logueado
exports.getMyRegistros = async (req, res) => {
  try {
    const obs = await Observacion.find({ registradoPor: req.user.id })
      .populate('alumno', 'nombre apellido grado')
      .sort({ createdAt: -1 });
      
    res.json(obs);
  } catch (error) { 
    res.status(500).json({ message: 'Error del servidor' }); 
  }
};


// Firmar observación (Alumno)
exports.firmarObservacion = async (req, res) => {
  try {
    const obs = await Observacion.findById(req.params.id);
    
    if (!obs || obs.alumno.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Sin permiso' });
    }
    
    obs.status = 'firmado'; 
    obs.descargo = req.body.descargo; 
    obs.firmaAlumno = req.body.firmaAlumno || null;
    obs.signedAt = new Date();
    
    await obs.save(); 
    res.json(obs);
  } catch (error) { 
    res.status(500).json({ message: 'Error al firmar' }); 
  }
};


// Ver todas las observaciones (Admin)
exports.getAllObservaciones = async (req, res) => {
  try {
    const obs = await Observacion.find()
      .populate('alumno', 'nombre apellido grado')
      .populate('registradoPor', 'nombre apellido')
      .sort({ createdAt: -1 });
      
    res.json(obs);
  } catch (error) { 
    res.status(500).json({ message: 'Error del servidor' }); 
  }
};


// ==========================================
// LÓGICA DE GENERACIÓN DE PDF
// ==========================================

// Función auxiliar para dibujar el bloque de la observación
function dibujarBloqueObservacion(doc, obs, startY) {
  const L = 40;          // Margen izquierdo
  const R = 555;         // Margen derecho
  const W = R - L;       // Ancho total del bloque
  const lineH = 16;      // Alto entre líneas de escritura
  const grayLine = '#999999';
  const black = '#000000';

  let y = startY;

  // Helpers para dibujar líneas y texto
  const hLine = (yPos, x1 = L, x2 = R) =>
    doc.moveTo(x1, yPos).lineTo(x2, yPos).lineWidth(0.5).strokeColor(grayLine).stroke();

  const label = (text, x, yPos, opts = {}) =>
    doc.font('Helvetica-Bold').fontSize(7).fillColor(black)
       .text(text, x, yPos, { continued: false, ...opts });

  const value = (text, x, yPos, maxWidth) =>
    doc.font('Helvetica').fontSize(7.5).fillColor('#222222')
       .text(text || '', x, yPos, { width: maxWidth, ellipsis: true });

  // Fila 1: FECHA / HORA / NUMERAL
  const opcionesFecha = { day: '2-digit', month: '2-digit', year: 'numeric' };
  const opcionesHora = { hour: '2-digit', minute: '2-digit' };
  
  const fecha = obs.fechaHecho 
    ? new Date(obs.fechaHecho).toLocaleDateString('es-CO', opcionesFecha) 
    : '___/___/______';
    
  const hora = obs.fechaHecho 
    ? new Date(obs.fechaHecho).toLocaleTimeString('es-CO', opcionesHora) 
    : '___:___';

  label('FECHA: Día', L, y);
  const partesFecha = fecha.split('/');
  
  value(partesFecha[0] || '__', L + 52, y, 20);
  label('Mes', L + 78, y);
  value(partesFecha[1] || '__', L + 92, y, 20);
  label('Año', L + 115, y);
  value(partesFecha[2] || '____', L + 129, y, 30);
  label('HORA:', L + 168, y);
  value(hora, L + 192, y, 40);
  label('NUMERAL P. CONVIVENCIA:', L + 238, y);
  value(obs.numeral || '', L + 338, y, W - 298);

  y += lineH;

  // Fila 2: DOCENTE
  const nombreDocente = obs.registradoPor
    ? `${obs.registradoPor.nombre || ''} ${obs.registradoPor.apellido || ''}`.trim()
    : '';
    
  label('DOCENTE/DIRECTIVO DOCENTE/CONOCEDOR:', L, y);
  value(nombreDocente, L + 185, y, W - 185);
  hLine(y + 10, L + 185, R);

  y += lineH;

  // Fila 3: ESTUDIANTE / GRADO
  const nombreAlumno = obs.alumno
    ? `${obs.alumno.nombre || ''} ${obs.alumno.apellido || ''}`.trim()
    : '';
    
  label('ESTUDIANTE:', L, y);
  value(nombreAlumno, L + 58, y, 280);
  hLine(y + 10, L + 58, L + 340);
  
  label('GRADO:', L + 350, y);
  value(obs.alumno?.grado || '', L + 382, y, W - 342);
  hLine(y + 10, L + 382, R);

  y += lineH + 2;

  // Sección: SITUACIÓN
  label('Situación presentada en lo académico y/o de convivencia:', L, y);
  y += 11;
  hLine(y);

  const descripcion = obs.descripcion || '';
  const lineasDesc = doc.font('Helvetica').fontSize(8)
    .heightOfString(descripcion, { width: W }) / lineH;
  const numLineasDesc = Math.max(5, Math.ceil(lineasDesc) + 1);

  if (descripcion) {
    doc.font('Helvetica').fontSize(8).fillColor('#111111')
       .text(descripcion, L + 2, y + 2, { width: W - 4, lineGap: lineH - 9 });
  }

  for (let i = 1; i <= numLineasDesc; i++) {
    hLine(y + i * lineH);
  }
  y += numLineasDesc * lineH + 6;

  // Sección: DESCARGOS
  label('Descargos y compromisos del estudiante y del acudiente:', L, y);
  y += 11;
  hLine(y);

  const descargo = obs.descargo || '';
  const lineasDes = doc.font('Helvetica').fontSize(8)
    .heightOfString(descargo, { width: W }) / lineH;
  const numLineasDes = Math.max(5, Math.ceil(lineasDes) + 1);

  if (descargo) {
    doc.font('Helvetica').fontSize(8).fillColor('#111111')
       .text(descargo, L + 2, y + 2, { width: W - 4, lineGap: lineH - 9 });
  }

  for (let i = 1; i <= numLineasDes; i++) {
    hLine(y + i * lineH);
  }
  y += numLineasDes * lineH + 6;

  // Sección: ACCIONES
  label('Acciones realizadas para dar acompañamiento y seguimiento a la situación presentada:', L, y);
  y += 11;
  hLine(y);

  const acciones = obs.acciones || '';
  const lineasAcc = doc.font('Helvetica').fontSize(8)
    .heightOfString(acciones, { width: W }) / lineH;
  const numLineasAcc = Math.max(4, Math.ceil(lineasAcc) + 1);

  if (acciones) {
    doc.font('Helvetica').fontSize(8).fillColor('#111111')
       .text(acciones, L + 2, y + 2, { width: W - 4, lineGap: lineH - 9 });
  }

  for (let i = 1; i <= numLineasAcc; i++) {
    hLine(y + i * lineH);
  }
  y += numLineasAcc * lineH + 8;

  // Constancia
  doc.font('Helvetica').fontSize(7.5).fillColor(black)
     .text('En constancia de lo anterior firman.', L, y);
  y += 20;

  // Firmas con imágenes
  const col1 = L;
  const col2 = L + 165;
  const col3 = L + 340;
  const firmaW = 120;
  const firmaH = 35; // Altura de la firma

  // Dibujar línea y firma del docente
  hLine(y, col1, col1 + firmaW);
  if (obs.firmaDocente) {
    try {
      const bufferDocente = Buffer.from(obs.firmaDocente.split(',')[1], 'base64');
      doc.image(bufferDocente, col1, y - firmaH, { 
        width: firmaW, 
        height: firmaH 
      });
    } catch(e) { 
      console.log('Error dibujando firma docente'); 
    }
  }

  // Dibujar línea y firma del estudiante
  hLine(y, col2, col2 + firmaW);
  if (obs.firmaAlumno) {
    try {
      const bufferAlumno = Buffer.from(obs.firmaAlumno.split(',')[1], 'base64');
      doc.image(bufferAlumno, col2, y - firmaH, { 
        width: firmaW, 
        height: firmaH 
      });
    } catch(e) { 
      console.log('Error dibujando firma alumno'); 
    }
  }

  // Línea del acudiente (siempre vacía, se firma a mano)
  hLine(y, col3, col3 + firmaW);

  y += 3;
  label('DOCENTE:', col1, y);
  label('ESTUDIANTE:', col2, y);
  label('ACUDIENTE:', col3, y);

  y += 10;
  label('', col3, y); // espacio
  label('PARENTESCO:', col3, y);
  hLine(y + 9, col3, col3 + firmaW);

  y += 18;

  return y; 
}


// Función auxiliar para dibujar el encabezado institucional
function dibujarEncabezado(doc, y = 30) {
  const pageW = doc.page.width;
  const escudoPath = path.join(__dirname, '../assets/escudo.jpg');

  // Dibujar el escudo si existe, si no, dibujar el recuadro
  if (fs.existsSync(escudoPath)) {
    // Dibuja la imagen un poco más arriba (y - 10) para que sobresalga elegantemente
    doc.image(escudoPath, pageW - 70, y - 10, { 
      width: 55, 
      height: 55 
    });
  } else {
    // Fallback por si no encuentra la imagen
    doc.rect(pageW - 75, y, 45, 45)
       .lineWidth(1)
       .strokeColor('#555555')
       .stroke();
       
    doc.font('Helvetica-Bold')
       .fontSize(6)
       .fillColor('#333333')
       .text('LOGO', pageW - 62, y + 16, { 
         width: 20, 
         align: 'center' 
       });
  }

  // Títulos centrados (ajustados para no chocar con el escudo)
  doc.font('Helvetica-Bold')
     .fontSize(9)
     .fillColor('#000000')
     .text('INSTITUCIÓN EDUCATIVA FRANCISCO DE PAULA SANTANDER', 40, y + 8, {
       width: pageW - 140, 
       align: 'center'
     });

  doc.font('Helvetica-Bold')
     .fontSize(8)
     .fillColor('#000000')
     .text('ACOMPAÑAMIENTO Y SEGUIMIENTO DE ESTUDIANTES / OBSERVADOR DEL ESTUDIANTE', 40, y + 22, {
       width: pageW - 140,
       align: 'center'
     });

  return y + 55;
}


// Función principal exportada para la ruta: Generar PDF
exports.generarPDF = async (req, res) => {
  try {
    const obs = await Observacion.findById(req.params.id)
      .populate('alumno', 'nombre apellido grado')
      .populate('registradoPor', 'nombre apellido');

    if (!obs) {
      return res.status(404).json({ message: 'Observación no encontrada' });
    }

    // Seguridad: Un alumno solo puede descargar sus propios PDFs
    if (req.user.rol === 'alumno' && obs.alumno._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Sin permiso para ver este documento' });
    }

    // Configurar el documento PDF
    const doc = new PDFDocument({
      size: 'LETTER',
      margins: { top: 25, bottom: 25, left: 40, right: 40 },
      info: {
        Title: 'Observador del Estudiante',
        Author: 'IE Francisco de Paula Santander',
      },
    });

    const fileName = `Observacion_${obs._id || 'nueva'}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    doc.pipe(res);

    // Dibujar encabezado
    let y = dibujarEncabezado(doc, 30);
    doc.moveTo(40, y - 5)
        .lineTo(555, y - 5)
        .lineWidth(1)
        .strokeColor('#000000')
        .stroke();

    // Dibujar bloque de la observación (1 sola vez = 1 sola página)
    y = dibujarBloqueObservacion(doc, obs, y);

    // Finalizar el documento
    doc.end();
  } catch (error) {
    res.status(500).json({ message: 'Error al generar el PDF' });
  }
};