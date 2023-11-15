const buttons = document.getElementsByClassName("grade-btn");
const result = document.getElementById("result")

// console.log("Starting: Found ", buttons.length, " buttons")
// console.log(buttons);
// console.log(buttons[0])
// console.log(buttons.item(1))
// console.log(Array.from(buttons))

Array.from(buttons).forEach(btn => {
    btn.addEventListener('click', (event) => {    
        var sibling_val = btn.parentElement.getElementsByClassName('grade-value')[0].value;
        result.innerText = Number(result.innerText) + Number(sibling_val) ;
    });
});


const reset = document.getElementById("reset")

reset.addEventListener("click", (event) => {    
    result.innerText = 0;
});

