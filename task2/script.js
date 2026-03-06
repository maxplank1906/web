 
// ARRAY: stores multiple values
let students = [];
 
// DOM SELECTION ──────────────────
// Find elements by their HTML id=""
const form =
  document.getElementById("studentForm");
const tableBody =
  document.getElementById("tableBody");
// Also:
// document.querySelector('.class')
// document.querySelectorAll('p')
 
// EVENT LISTENER ─────────────────
// Runs function when form submitted
form.addEventListener("submit",
  function(e) {
 
  // Prevent browser page reload
  e.preventDefault();
 
  // GET VALUES ─────────────────
  // .value reads typed input text
  const name =
    document.getElementById("name")
    .value;
  const marks =
    document.getElementById("marks")
    .value;
  const grade =
    document.getElementById("grade")
    .value;
 
  // VALIDATION ──────────────────
  // === strict (checks type too)
  // ==  loose ("1"==1 is TRUE)
  if (name === "" || marks === "") {
    alert("Fill all fields"); // popup
    return; // exit early
  }
 
  // OBJECT ──────────────────────
  // Key-value pairs bundle data
  const student = {
    name:  name,
    marks: marks,
    grade: grade
  };
 
  // push() adds to end of array
  students.push(student);
 
  // Clear table before redraw
  tableBody.innerHTML = "";
 
  // FOREACH LOOP ────────────────
  // Runs once per array item
  students.forEach(function(s) {
    // s = current student object
 
    // TEMPLATE LITERAL ─────────
    // Backtick `` + ${variable}
    tableBody.innerHTML += `
      <tr>
        <td>${s.name}</td>
        <td>${s.marks}</td>
        <td>${s.grade}</td>
      </tr>`;
  });
 
  form.reset(); // clear inputs
}); // end addEventListener
 
// ═══ KEY JS CONCEPTS ════════════
// Data types:
//   String Number Boolean
//   null undefined Object Array
// Operators:
//   + - * / % ** (exponent)
//   && || ! ?? (nullish coalesce)
//   ternary: x>0 ? "pos" : "neg"
// Loops:
//   for(let i=0;i<n;i++){}
//   for(let x of array){}
//   for(let k in object){}
//   while(cond){}
// Arrow function:
//   const add = (a,b) => a+b;
// Array methods:
//   push pop shift unshift
//   map filter find includes
//   forEach sort reverse join
// DOM methods:
//   el.classList.add('x')
//   el.setAttribute('href','url')
//   el.style.color = 'red'
//   document.createElement('div')
//   parent.appendChild(child)	
//   el.remove()
// Events: click dblclick keydown
//   input change submit mouseover
// Error handling:
//   try{ }catch(e){ }finally{ }
// JSON:
//   JSON.stringify(obj)
//   JSON.parse(str)
// Timers:
//   setTimeout(fn, 1000)
//   setInterval(fn, 1000)
