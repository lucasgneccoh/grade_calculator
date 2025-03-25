const buttons = document.getElementsByClassName("grade-btn");
const keys = document.getElementsByClassName("grade-char");
const use_keys = document.getElementById("checkbox-use-keys")
const result = document.getElementById("result")
const record = document.getElementById("record")
const stats = document.getElementById("stats")


// Update stats line
function stat_line(){
    let s = record.innerHTML.split("<br>").slice(0, -1).map((x) => Number(x));
    let n = s.length ;
    let m = Math.round(Math.min(...s)*10)/10;
    let M = Math.round(Math.max(...s)*10)/10;
    let sum = Math.round(s.reduce((x, y) => x+y)*100)/100;
    let mean = Math.round(sum/n*10)/10

    stats.innerText = `mean: ${mean}\n min: ${m}\n max: ${M}\n count: ${n}`;

}

// Buttons add
Array.from(buttons).forEach(btn => {
    btn.addEventListener('click', (event) => {    
        var sibling_val = btn.parentElement.getElementsByClassName('grade-value')[0].value;
        result.innerText = Number(result.innerText) + Number(sibling_val)  ;
    });
});


function step(){
    record.innerHTML = result.innerText + "<br>" + record.innerHTML;
    result.innerText = 0;
    stat_line();
}

// For doing it with keys
document.addEventListener('keydown', (event) => {
    if (use_keys.checked){
        if (event.key === ' '){
            step() ;
        }
        else{
            if (event.key === 'Backspace'){
                let s = record.innerHTML.split("<br>").filter((x) => (x.length > 0)).slice(1).join("<br>");
                record.innerHTML = s;
            }
            else{
                Array.from(keys).forEach(
                    key => {
                        if( key.innerText.replace('(', '').replace(')', '') === event.key){
                            // Get sibling, get value, add to total
                            var sibling_val = key.parentElement.getElementsByClassName('grade-value')[0].value;
                            result.innerText = Number(result.innerText) + Number(sibling_val) ;
                        }
                    }
                );
            }
        }
    }
});

const reset = document.getElementById("reset")

reset.addEventListener("click", (event) => {
    step() ;
});

