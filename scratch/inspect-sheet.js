const fetch = require('node-fetch');

async function inspectSheet() {
  const sheetId = '1a9wF8bAH2-V0zUF_f6l0ZDXmRsMoW7HioD79RgxrZ5I';
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`;
  
  try {
    const res = await fetch(url);
    const text = await res.text();
    // Google returns a prefix like `/*O_o*/\ngoogle.visualization.Query.setResponse(`
    console.log("Raw response snippet:", text.substring(0, 1000));
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}') + 1;
    const jsonStr = text.substring(jsonStart, jsonEnd);
    const data = JSON.parse(jsonStr);
    
    console.log("Sheet cols:", data.table.cols.map(c => c.label));
    console.log("First row:", data.table.rows[0]?.c?.map(v => v?.v));
    console.log("Second row:", data.table.rows[1]?.c?.map(v => v?.v));
  } catch (err) {
    console.error("Error inspecting sheet:", err);
  }
}

inspectSheet();
