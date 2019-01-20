var budgetController = (function() {    // voor het binnenwerk (smart)

    var Expense = function(id, description, value) {        // constructor voor expenseobjecten
        this.id = id;
        this.description = description;
        this.value = value;
        this.percentage = -1;
    }

    Expense.prototype.calcPercentage = function(totalIncome) {
        if (totalIncome > 0) {
            this.percentage = Math.round((this.value / totalIncome) * 100);
        } else {
            this.percentage = -1;
        }
    };

    Expense.prototype.getPercentage = function() {
        return this.percentage;
    }

    var Income = function(id, description, value) {         // ik vind het eigenlijk maar niks dat de eerste drie regels exact hetzelfde zijn. Hadden we daar geen superclasses voor? Zijn er geen superconstructors?
        this.id = id;
        this.description = description;
        this.value = value;
    }

    var calculateTotal = function(type) {
        var sum = 0;
        data.allItems[type].forEach(function(current) {     // forEach is een arraymethod, dus je zet hem op de array (met objecten erin), gooit er weer een functie in met current, index, en array die je niet allemaal hoeft te specificeren en pas in de functie ga je naar de inhoud van het object
            sum += current.value;
        });
        data.totals[type] = sum;    // onze nieuwe sum opslaan in data
    };

    var data = {        // zodat we geen variabelen hebben rondslingeren...
        allItems: {     // is ipv los allExpenses en allIncomes in het dataobject
            exp: [],
            inc: []     // is dus een array met newItem-objecten met daarin id, description en value
        },
        totals: {
            exp: 0,
            inc: 0
        },
        budget: 0,
        percentage: -1      // begint als -1 als soort code onder programmeurs dat er nog niks is
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
        },

        deleteItem: function(type, id) {
            var ids, index;
            // nu hebben we een probleem, want het id-nummer van het te verwijderen element is vanwege juist deze mogelijkheid tot verwijderen niet per se hetzelfde als de plaats in de data-array waar ze in staan. Althans - met de push-methode niet. We hadden ook items in data kunnen zetten met array[i] = item[i] of zoiets. Maar dan had je later lege plekken gekregen bij het deleten...
            ids = data.allItems[type].map(function(current) { // map returnt een nieuwe array waarop een of andere bewerking is uitgevoerd
                return current.id;      // dus nu heb je een array met id-nummers ipv een array met newItem-objecten met daarin id-nummers
            });

            index = ids.indexOf(id);    // dus hiermee zoeken we de index van de id die we erin hebben gegooid

            if (index !== -1) {         // dit is voor het geval een newItem op magische wijze is verschenen zonder id-nummer, aangezien je niet op de delete-button kunt klikken als er geen item is
                data.allItems[type].splice(index, 1);   // juiste element uit data verwijderen met .splice(welk indexnummer, hoeveel elementen) 
            }
        },

        calculateBudget: function() {
            // calc total income and total expenses. Ennnnnn dit gaan we in een aparte niet-publieke functie doen, dus hierboven, buiten return
            calculateTotal('inc');
            calculateTotal('exp');

            // calc budget: inc - exp
            data.budget = data.totals.inc - data.totals.exp;
            // calc % of inc that was spent
            if (data.totals.inc > 0) {          // als je alleen uitgaven hebt, probeert ie door 0 te delen en dan krijg je de waarde Infinity (als in, eindeloze schulden). Kennelijk mag dat niet blijven staan
                data.percentage = Math.round((data.totals.exp / data.totals.inc) * 100);
            } else {
                data.percentage = -1;
            }
        },

        calculatePercentages: function() {
            data.allItems.exp.forEach(function(cur) {
                cur.calcPercentage(data.totals.inc);
            });
        },

        getPercentages: function() {
            var allPerc = data.allItems.exp.map(function(cur) {
                return cur.getPercentage();
            });
            return allPerc;
        },

        getBudget: function() {             // simpele getter, doet niets anders dan info bezorgen in net pakketje
            return {
                budget: data.budget,
                totalInc: data.totals.inc,
                totalExp: data.totals.exp,
                percentage: data.percentage
            };
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
        expensesContainer: '.expenses__list',
        budgetLabel: '.budget__value',
        incomeLabel: '.budget__income--value',
        expensesLabel: '.budget__expenses--value',
        percentageLabel: '.budget__expenses--percentage',
        container: '.container',
        expensesPercLabel: '.item__percentage',
        dateLabel: '.budget__title--month'
    }

    var formatNumber = function(num, type) {     // we willen de bedragen weergeven in een typisch bedragenformat: 1.234,56 (Jonas houdt de Amerikaanse notatie aan, maar de rest van de wereld inclusief de wetenschappelijke wereld doet het zo, dus.)
        var numSplit, int, dec;

        num = Math.abs(num);    // hiermee worden negatieve getallen geneutraliseerd, en num dus herschreven als per definitie positief
        num = num.toFixed(2);   // number method (ook primitives als strings en nummers kunnen methoden hebben; daarvoor wrapt JS ze voor de gelegenheid in een object...) waarmee elk getal twee decimalen krijgt/houdt en in een string verandert(!)
        
        numSplit = num.split('.');
        
        int = numSplit[0];
        if (int.length > 3) {
            int = int.substr(0,int.length-3) + '.' + int.substr(int.length-3,3);    // hiermee pakken we een deel van een string, te beginnen bij [0] en dan het aantal tekens dat je wilt selecteren
        }
        
        dec = numSplit[1];
        
        return (type === 'exp' ? '-' : '+') + ' ' + int + ',' + dec;    // pak type, kijk of het + of - moet zijn, plus spatie, plus het 'hele' deel dat we net hebben omgezet naar iets als 3.455, plus komma, plus decimalen
    };

    var nodeListForEach = function(list, callback) {        // nu hebben we weer het probleem dat we een lijst hebben die geen array is. Vandaar deze custom forEach speciaal voor zulke lijsten
        for (var i = 0; i < list.length; i++) {             //  --> doe die shit op regel 218 voor elk item in de list
            callback(list[i], i);
        }
    };

    return {                            // dit ding moet bereikbaar zijn voor de andere controllers; het is 'public'
        getDOMstrings: function() {     // we willen DOMstrings ook elders gebruiken, dus aan alle zooi die UIController publiek maakt (returnt) voegen we nu dit toe
            return DOMstrings;          
        },

        getInput: function() {
            return {                // dus UIController returnt een functie die op haar beurt een object returnt met daarin deze waardes, zodat we nu én de functie kunnen aanroepen van buiten deze IIFE, maar ook (daarna) de waardes los kunnen gebruiken
                type: document.querySelector(DOMstrings.inputType).value,      // dit gaat over het aflezen van de waarde (+ of -, ofwel inc of exp als value) van die selector links van het inputveld van de bedragen. (Die ik het liefst zou elimineren, want bij een uitgave kun je toch gewoon een negatief bedrag invullen?? Veel minder werk)
                description: document.querySelector(DOMstrings.inputDescription).value,     // beschrijvingsveld
                value: parseFloat(document.querySelector(DOMstrings.inputValue).value)      // bedrag, als string, met parseFloat om string naar getal om te zetten, anders rekent het zo lastig
            };
        },

        changedType: function() {
            var fields = document.querySelectorAll(
                DOMstrings.inputType + ',' +
                DOMstrings.inputDescription + ',' +
                DOMstrings.inputValue);

            nodeListForEach(fields, function(cur) {
                cur.classList.toggle('red-focus');     // als die +-selector verandert (als het goed is van + naar -), voeg red-focus toe, als ie terug verandert, haal 'm weer weg. En het is een classList-methode, dus je hebt geen puntje nodig... Dus gewoon 'red-focus' en niet '.red-focus'... Zucht.
            });
            document.querySelector(DOMstrings.inputButton).classList.toggle('red');
        },

        addListItem: function(obj, type) {      // veeleisend als we zijn, willen we de nieuwe items ook nog in de UI zien ipv alleen in de console
            var html, newHtml, element;
            // creëer html-string met opvulling
            if (type === 'inc') {
                element = DOMstrings.incomeContainer;       // opmerking Jonas: dit html-element wordt hier dus gehardcoded! Bij veranderen moet je ook checken of DeteleItem nog klopt (DOM traversen)
                html = '<div class="item clearfix" id="inc-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>'
            } else if (type === 'exp') {  
                element = DOMstrings.expensesContainer;  
                html = '<div class="item clearfix" id="exp-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">%percentage%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>'
            }
            
            // vervang opvulling door variabelen
            newHtml = html.replace('%id%', obj.id);
            newHtml = newHtml.replace('%description%', obj.description);    // hier gebruik je dus de net gecreëerde newHtml als input
            newHtml = newHtml.replace('%value%', formatNumber(obj.value, type));                // en hier de vorige versie van newHtml

            // gooi html het html-bestand in
            document.querySelector(element).insertAdjacentHTML('beforeend', newHtml);   // dus, je zoekt in de html het element waar je iets in wilt gooien, je zegt waar item precies moet komen (de smaken zijn: beforebegin (wordt sibling erboven erbij), afterbegin (wordt dus een child bovenaan erbij), beforeend (child onderaan erbij) en afterend (sibling onderaan erbij)). Jonas kiest ervoor nieuwe items onderaan in de lijst toe te voegen ipv bovenaan waar je ze meteen ziet zoals op mijn bankoverzicht

        },

        clearFields: function() {   
            var fields, fieldsArr;
            // het scheelt een regel als je qsAll gebruikt, maar dan moet je er wel de CSS-selectors aan voeren alsof het een string met variabelen is
            fields = document.querySelectorAll(DOMstrings.inputDescription + ', ' + DOMstrings.inputValue); // dit returnt zo'n raar html-ding dat op een array lijkt maar het niet is: een lijst. Jonas' truc is om er slice op te gebruiken, die arraymethode returnt weer een array. Maar...
            // vraagje: doen we al dit gedoe met lijst omzetten naar array alleen maar omdat we querySelectorAll hebben gebruikt ipv de inputDescription en inputValue apart op te vragen??
            fieldsArr = Array.prototype.slice.call(fields); // ...dat gaat niet op een lijst. Dus we gebruiken eerst slice op het prototype array (de constructor achter de schermen), gooien daar (nu het een functie is, slice) de functiemethode .call overheen en voeren die dan de lijst op de plek om this aan te passen. Weird.

            fieldsArr.forEach(function(current, index, array) {    // callback ontvangt parameters mbt het element dat ie nu behandelt, het indexnummer van de array zodat ie weet waar ie gebleven is en de array zelf, in dit geval fieldsArr.
                current.value = "";                            // value is dan weer dezelfde key als in de newItem-objecten enzo
            });

            fieldsArr[0].focus();   // hiermee zet je de focus (in welk veld de cursor staat) terug op het eerste element in fieldsArr. C'est quoi? Het descriptionveld.
        },

        deleteListItem: function(selectorID) {
            var el = document.getElementById(selectorID);
            el.parentNode.removeChild(el);    // JavaScript kan niet het element zelf verwijderen, maar wel een child ervan. Dus je selecteert het te verwijderen element, gaat één stap omhoog met parentNode, en selecteert vervolgens het te vermoorden kind met precies dezelfde selectie als eerst. Zou je kunnen inkorten door de container te selecteren, maar dan hardcode je weer dingen
        },                                     // dus je laat eigenlijk de boodschapper een briefje bezorgen met 'kill the messenger'.     "Hey kid, is your mommy home?" ... "Hello mrs Parent, kill your kid"

        displayBudget: function(obj) {
            var type;
            obj.budget > 0 ? type = 'inc' : type = 'exp';
            
            document.querySelector(DOMstrings.budgetLabel).textContent = formatNumber(obj.budget, type);    // we veranderen alleen de tekst, niet de html
            document.querySelector(DOMstrings.incomeLabel).textContent = formatNumber(obj.totalInc, 'inc');
            document.querySelector(DOMstrings.expensesLabel).textContent = formatNumber(obj.totalExp, 'exp');

            if (obj.percentage > 0) {
                document.querySelector(DOMstrings.percentageLabel).textContent = obj.percentage + '%';  // als het percentage ergens op slaat, willen we getal% doorgeven
            } else {
                document.querySelector(DOMstrings.percentageLabel).textContent = "-";   // zonder inkomen ook geen percentage
            }
        },

        displayPercentages: function(percentages) {
            var fields = document.querySelectorAll(DOMstrings.expensesPercLabel);   // returnt een lijst - een node list, want elke div etc in html heet een node.
            
            nodeListForEach(fields, function(current, index) {      // hier gooien we in wat we gewend zijn te doen voor een forEach
                if (percentages[index] > 0) {
                    current.textContent = percentages[index] + '%';     // verander het tekstelement van het huidige item in de lijst in het bijbehorende huidige percentage
                } else {
                    current.textContent = '-';
                }
            })
        },

        displayMonth: function() {
            var now, year, month, months;
            now = new Date();

            year = now.getFullYear();
            month = now.getMonth();     // hiermee krijg je een nummer, en dat nummer is zero-based... Dus februari is 1.
            months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

            document.querySelector(DOMstrings.dateLabel).textContent = months[month] + ' ' + year;
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
            } // else helemaal niks. Ook niet erg dreigend
        });

        document.querySelector(DOM.container).addEventListener('click', ctrlDeleteItem);

        document.querySelector(DOM.inputType).addEventListener('change', UICtrl.changedType);   // call die functie als hier daadwerkelijk iets anders wordt geselecteerd (change) en niet alleen wordt geklikt

    }; // dus waar zetten we de call? In weer een aparte functie: init. Zie onder

    var updateBudget = function() {
        var budget;
        // calculate budget
        budgetCtrl.calculateBudget();
        // return budget (want aparte functies voor simpele taken is prima, sez Jonas)
        budget = budgetCtrl.getBudget();
        // display budget on UI
        UICtrl.displayBudget(budget);
    };

    ctrlAddItem = function() {
        var input, newItem;
        // get field input data
        input = UICtrl.getInput();      // ofwel input is een object met drie waardes, verkregen via de publieke UIController method getInput
        //console.log(input);                 // ...waarom staat er bij Jonas bij dat het een Object is en bij mij niet?
        
        if (input.description !== "" && !isNaN(input.value) && input.value > 0) {   // check of input wel een beetje door de beugel kan (met aparte isNaN-methode ipv iets als 'value === NaN' - hoe leuk)
            // add item to budget controller
            newItem = budgetCtrl.addItem(input.type, input.description, input.value); // dus deze info (een object geproduceerd uit de Income/Expense constructor mal) komt uit UIC, gaat naar budgetC en de communicatie tussen die twee wordt hier gedaan, middels publieke functies en info uit de andere twee. 
            // add item to UI
            UICtrl.addListItem(newItem, input.type);
            // clear fields
            UICtrl.clearFields();
            // calculate and update budget
            updateBudget();

            // calc and update expense percentages
            updatePercentages();
        }   // else screw you met je foute input :-P
    };

    var updatePercentages = function() {
        // calc %
        budgetCtrl.calculatePercentages();
        // read %from bud contrl
        var percentages = budgetCtrl.getPercentages();
        // update UI
        UICtrl.displayPercentages(percentages);

    };

    var ctrlDeleteItem = function(event) {
        var itemID, splitID, type, ID;                             // opmerking Jonas: we hebben met die 4 parentNodes dus het traversen van de DOM gehardcoded, máár: we hebben de structuur van het element bij het toevoegen óók gehardcoded (die lange html-string hierboven in addListItem)

        itemID = event.target.parentNode.parentNode.parentNode.parentNode.id;       // .parentNode maakt dat het target niet langer dat icoontje is maar de button zelf. De tweede, derde en vierde .parentNode verschuift de aandacht omhoog naar het hele Income/Expense-element, en dan daar de id van

        if (itemID) {

            splitID = itemID.split('-');    // .split splijt een string, haalt het gevoerde element (de -) eruit en returnt de rest in brokjes in een array. Dus 'inc-1' wordt [inc, 1], en 'dd-ss-tt-hh' wordt [dd, ss, tt, hh].
            type = splitID[0];
            ID = parseInt(splitID[1]);        // met parseInt omdat het deel van een string was en dus nog steeds een string is, dus kun je hem niet met !== vergelijken met een nummer uit data.totals[type] en ooit true krijgen. != vermijdt Jonas altijd.  (dus deze had je met deze altijd even lange ID's ook nog wel met itemID[4] kunnen doen, maar voor type is dat omslachtiger...)

            budgetCtrl.deleteItem(type, ID);

            UICtrl.deleteListItem(itemID);  // met UIC spreek je de taal van de DOM, dus rechtstreeks wat je uit de DOM hebt ontvangen: 'inc-1' of zoiets

            updateBudget();

            updatePercentages();

        }
    };

    return {    
        init: function() {      // dus we returnen hier een initfunctie die dus expliciet de boel moet opstarten; niks mag automatisch...?
            console.log('there but for the grace of god goes this app');
            UICtrl.displayMonth();
            UICtrl.displayBudget({      // dit doen we dus alléén maar om alles in het begin op 0 te hebben in plaats van op die willekeurige getallen die Jonas er zelf in gehardcoded heeft. Lekker Jonas
                budget: 0,
                totalInc: 0,
                totalExp: 0,
                percentage: -1
            });
            setupEventListeners();
        }
    }

})(budgetController, UIController);

// Behold! De enige regel code buiten de controllers. Die dingen hebben wel een control issue

controller.init();  // <-- [cue hemels gezang]