var budgetController = (function() {    // voor het binnenwerk (smart)

    var Expense = function(id, description, value) {        // constructor voor expenseobjecten
        this.id = id;
        this.description = description;
        this.value = value;
    }

    var Income = function(id, description, value) {         // ik vind het eigenlijk maar niks dat de eerste drie regels exact hetzelfde zijn. Hadden we daar geen superclasses voor? Zijn er geen superconstructors?
        this.id = id;
        this.description = description;
        this.value = value;
    }

    var data = {        // zodat we geen variabelen hebben rondslingeren...
        allItems: {     // is ipv los allExpenses en allIncomes in het dataobject
            exp: [],
            inc: []
        },
        totals: {
            exp: 0,
            inc: 0
        }
    }

    return {
        addItem: function(type, des, val) {
            var newItem, ID;
            
            if (data.allItems[type].length > 0) {   // bij eerste item zit er niks in de array, dus array.length-1 gaat niet werken
                ID = data.allItems[type][data.allItems[type].length - 1].id + 1;   // ID gaat dus apart voor inc en exp. Nieuwe is 1 + de id van het laatste item in de array met itemobjecten  (niet array.length + 1, want we willen ook dingen verwijderen)
            } else {
                ID = 1;     // waarom zou je met 0 beginnen??
            }
            if (type === 'exp') {                       // we weten al welke types er zijn, dus hier bepalen we welke constructor er dan moet worden gebruikt
                newItem = new Expense(ID, des, val);
            } else if (type === 'inc') {
                newItem = new Income(ID, des, val);
            }

            data.allItems[type].push(newItem);      // nieuw ding in data gooien
            return newItem;
        }
    }

})();

var UIController = (function() {        // voor het zichtbare stuk (dumb)
    
    var DOMstrings = {                  // Jonas wil zijn variabelen graag op een centrale plaats houden zodat ie, mocht ie de classnamen later veranderen, dat hier maar op één plek hoeft te doen ipv een equivalent van Zoek & Vervang.
        inputType: '.add__type',
        inputDescription: '.add__description',
        inputValue: '.add__value',
        inputButton: '.add__btn',
        incomeContainer: '.income__list',       // de locatie in de html waar we nieuwe inkomsten gaan droppen
        expensesContainer: '.expenses__list'
    }

    return {                            // dit ding moet bereikbaar zijn voor de andere controllers; het is 'public'
        getDOMstrings: function() {     // we willen DOMstrings ook elders gebruiken, dus aan alle zooi die UIController publiek maakt (returnt) voegen we nu dit toe
            return DOMstrings;          // Maar waarom staan de DOMstrings-waardes hier niet direct in, zoals bij de input? Omdat ze statisch zijn?
        },

        getInput: function() {
            return {                // dus UIController returnt een functie die op haar beurt een object returnt met daarin deze waardes, zodat we nu én de functie kunnen aanroepen van buiten deze IIFE, maar ook (daarna) de waardes los kunnen gebruiken
                type: document.querySelector(DOMstrings.inputType).value,      // dit gaat over het aflezen van de waarde (+ of -, ofwel inc of exp als value) van die selector links van het inputveld van de bedragen. (Die ik het liefst zou elimineren, want bij een uitgave kun je toch gewoon een negatief bedrag invullen?? Veel minder werk)
                description: document.querySelector(DOMstrings.inputDescription).value,     // beschrijvingsveld
                value: document.querySelector(DOMstrings.inputValue).value                   // bedrag
            };
        },

        addListItem: function(obj, type) {      // veeleisend als we zijn, willen we de nieuwe items ook nog in de UI zien ipv alleen in de console
            var html, newHtml, element;
            // creëer html-string met opvulling
            if (type === 'inc') {
                element = DOMstrings.incomeContainer;
                html = '<div class="item clearfix" id="income-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>'
            } else if (type === 'exp') {  
                element = DOMstrings.expensesContainer;  
                html = '<div class="item clearfix" id="expense-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">%percentage%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>'
            }
            
            // vervang opvulling door variabelen
            newHtml = html.replace('%id%', obj.id);
            newHtml = newHtml.replace('%description%', obj.description);    // hier gebruik je dus de net gecreëerde newHtml als input
            newHtml = newHtml.replace('%value%', obj.value);                // en hier de vorige versie van newHtml

            // gooi html het html-bestand in
            document.querySelector(element).insertAdjacentHTML('beforeend', newHtml);   // dus, je zoekt in de html het element waar je iets in wilt gooien, je zegt waar item precies moet komen (de smaken zijn: beforebegin (wordt sibling erboven erbij), afterbegin (wordt dus een child bovenaan erbij), beforeend (child onderaan erbij) en afterend (sibling onderaan erbij)). Jonas kiest ervoor nieuwe items onderaan in de lijst toe te voegen ipv bovenaan waar je ze meteen ziet zoals op mijn bankoverzicht

        }
    };
})();


var controller = (function(budgetCtrl, UICtrl) {          // voor het samenbrengen van smart en dumb

    var setupEventListeners = function() {      // eenmalig te callen (gok ik) functie, is eigenlijk alleen om de eventlisteners bij elkaar te houden
        var DOM = UICtrl.getDOMstrings();       // DOMstrings binnenhalen uit UIController. Wel een beetje confronterende naam
        document.querySelector(DOM.inputButton).addEventListener('click', ctrlAddItem);   // exact hetzelfde als Enter, dus zie ctrlAddItem. Die is nu dus direct het argument, niet meer een functie in een anonieme functie
        document.addEventListener('keypress', function(event) {     // eventlistener voor toetsen, waarbij de parameter in de functie het object is dat meekomt met zo'n listener
            if (event.keycode === 13 || event.which === 13) {       // keycode is de property die individuele toetsen identificeert. In oudere browsers heet ie soms which
                // exact hetzelfde als wanneer add__btn wordt aangeklikt, vandaar ctrlAddItem:
                ctrlAddItem();
            } // else helemaal niks
        });
    }; // dus waar zetten we de call? In weer een aparte functie: init. Zie onder

    ctrlAddItem = function() {
        var input, newItem;
        // get field input data
        input = UICtrl.getInput();      // ofwel input is een object met drie waardes, verkregen via de publieke UIController method getInput
        //console.log(input);                 // ...waarom staat er bij Jonas bij dat het een Object is en bij mij niet?
        // add item to budget controller
        newItem = budgetCtrl.addItem(input.type, input.description, input.value); // dus deze info (een object geproduceerd uit de Income/Expense constructor mal) komt uit UIC, gaat naar budgetC en de communicatie tussen die twee wordt hier gedaan, middels publieke functies en info uit de andere twee. 
        // add item to UI
        UICtrl.addListItem(newItem, input.type);

        // calculate budget
        // display budget on UI
    };

    return {    
        init: function() {      // dus we returnen hier een initfunctie die dus expliciet de boel moet opstarten; niks mag automatisch...?
            console.log('there but for the grace of god goes this app');
            setupEventListeners();
        }
    }

})(budgetController, UIController);

// Behold! De enige regel code buiten de controllers. Die dingen hebben wel een control issue

controller.init();  // [cue hemels gezang]