export const nowJST = () => new Date(new Date().toLocaleString("en-US",{timeZone:"Asia/Tokyo"}));
export const esc = (s)=> String(s??"").replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
export function buildIcs(ev){
  const dt=(d)=> new Date(d).toISOString().replace(/[-:]/g,"").split(".")[0]+"Z";
  return ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//U-culling//Live//JP","BEGIN:VEVENT",
    `UID:${crypto.randomUUID()}@u-culling.jp`,`DTSTAMP:${dt(new Date())}`,
    `DTSTART:${dt(ev.start)}`, ev.end?`DTEND:${dt(ev.end)}`:null,
    `SUMMARY:${ev.title}`, ev.place?`LOCATION:${ev.place}`:null, ev.url?`URL:${ev.url}`:null,
    "END:VEVENT","END:VCALENDAR"].filter(Boolean).join("\r\n");
}
export function download(filename,text){
  const a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob([text],{type:"text/calendar"}));
  a.download=filename; a.click(); URL.revokeObjectURL(a.href);
}
