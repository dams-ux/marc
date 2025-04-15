

let name = "John Doe"
let age = 30            

console.log(name)
console.log(age)        

console.log(`Hello ${name}, you are ${age} years old.`) // Hello John Doe, you are 30 years old.

let myage = 18

if (myage <= 18){
    console.log("You are a minor.") // You are a minor.
}               
else if (myage >= 18 && myage < 65) {       
    console.log("You are an adult.") // You are an adult.
}
else {
    console.log("You are a senior.") // You are a senior.
}       


let fruits = ["apple", "banana", "cherry"]
let i = 2  
while (i < fruits.length) {
    console.log(fruits[i]) // apple, banana, cherry
    i++
    if (i == 2) {
        break // Stop the loop when i is 2
    }
    console.log("End of loop") // End of loop
}

