function generateCalculator(model, root, templates) {
    let props = userProperties('training_calc_');

    let mainTitle = document.createElement('h2');
    mainTitle.innerText = 'Калькулятор расчёта подходов и повторений';
    mainTitle.classList.add('main-title');
    root.appendChild(mainTitle);
    let mainDescription = document.createElement('div');
    mainDescription.innerText = 'Заполни все поля и получи программу тренировок на неделю';
    mainDescription.classList.add('main-description');
    root.appendChild(mainDescription);

    let chooseMonthElement = layoutCalendarInput(root, 'Месяц');
    let monthOpt;
    for (let i = 0; i < model.months.length; i++) {
        let mon = model.months[i];
        monthOpt = document.createElement('option');
        monthOpt.innerHTML = mon.monthName;
        monthOpt.value = mon.monthId;
        chooseMonthElement.appendChild(monthOpt);
    }
    chooseMonthElement.value = props.get('monthId', 1);

    let chooseWeekElement = layoutCalendarInput(root, 'Неделя');

    let updateWeekChooser = function() {
        chooseWeekElement.innerHTML = '';
        let weekOpt;
        for (let i = 0; i < model.weeks.length; i++) {
            let week = model.weeks[i];
            if (week.monthId == chooseMonthElement.value) {
                weekOpt = document.createElement('option');
                weekOpt.innerHTML = week.weekName;
                weekOpt.value = week.weekId;
                chooseWeekElement.appendChild(weekOpt);
            }
        }
        let monthProps = getMonthProps(chooseMonthElement.value);
        let weekId = monthProps.get('weekId', null);
        if (weekId) {
            chooseWeekElement.value = weekId;
        }
    };

    let weekContainer = document.createElement('div');
    root.appendChild(weekContainer);

    let updateTrainingWeek = function() {
        let weekId = chooseWeekElement.value;
        let weekProps = userProperties('training_calc_week_' + weekId + '_');
        for (let i = 0; i < model.weeks.length; i++) {
            let weekModel = model.weeks[i];
            if (weekModel.weekId == weekId) {
                generateTrainingWeek(weekModel, weekContainer, templates, weekProps);
                break;
            }
        }
    };

    let updateAll = function () {
        updateWeekChooser()
        updateTrainingWeek();
    };

    chooseMonthElement.onchange = function() {
        updateAll();
        props.set('monthId', chooseMonthElement.value);
    };
    chooseWeekElement.onchange = function() {
        updateTrainingWeek();
        let monthProps = getMonthProps(chooseMonthElement.value);
        props.set('monthId', chooseMonthElement.value);
        monthProps.set('weekId', chooseWeekElement.value);
    };
    updateAll();
}

function layoutCalendarInput(parentElement, title) {
    let container = document.createElement('div');
    container.classList.add('calendar-input-container');
    parentElement.appendChild(container);
    let caption = document.createElement('div');
    caption.innerText = title;
    caption.classList.add('calendar-input-caption');
    container.appendChild(caption);
    let chooserContainer = document.createElement('div');
    chooserContainer.classList.add('calendar-input-chooser');
    container.appendChild(chooserContainer);
    let chooser = document.createElement('select');
    chooserContainer.appendChild(chooser);
    return chooser;
}

function getMonthProps(monthId) {
    return userProperties('training_calc_month_' + monthId + '_');
};

function generateTrainingWeek(model, root, templates, props) {
    root.innerHTML = '';
    var tparams = {
        dayInputId: 'calc_day_input',
        userInputId: 'calc_user_input',
        trainingPlanId: 'calc_training_plan'
    };
    var renderedWeek = Mustache.render(templates.weekTemplate, tparams);
    root.innerHTML = renderedWeek;

    let chooseDayElement;
    if (model.days) {
        chooseDayElement = layoutCalendarInput(document.getElementById(tparams.dayInputId), 'День');
        var dayOpt;
        for (var i = 0; i < model.days.length; i++) {
            var dayModel = model.days[i];
            dayOpt = document.createElement('option');
            dayOpt.innerHTML = dayModel.name;
            dayOpt.value = dayModel.coeff;
            chooseDayElement.appendChild(dayOpt);
        }
        chooseDayElement.selectedIndex = props.get('dayId', 0);
    }
    var userInput = document.getElementById(tparams.userInputId);
    var trainingPlan = document.getElementById(tparams.trainingPlanId);
    var repCntChangers = [];
    let globalTooHardToggle = document.createElement('input');
    for (let i = 0; i < model.exs.length; i++) {
        let ex = model.exs[i];
        let exMaxBlock = document.createElement('div');
        exMaxBlock.classList.add('ex-max-block');
        userInput.appendChild(exMaxBlock);
        let titleCont = document.createElement('div');
        titleCont.classList.add('ex-max-title-container');
        exMaxBlock.appendChild(titleCont);
        lbl = document.createElement('label');
        let exTitle = '' + (i + 1) + '. ' + ex.name;
        lbl.innerText = exTitle;
        lbl.classList.add('ex-max-title');
        titleCont.appendChild(lbl);
        let maxInputCont = document.createElement('div');
        maxInputCont.classList.add('ex-max-input-container');
        exMaxBlock.appendChild(maxInputCont);
        let maxInput = document.createElement('input');
        maxInput.type = 'number';
        maxInput.value = props.get(ex.name, '');
        maxInput.classList.add('ex-max-input');
        maxInputCont.appendChild(maxInput);
        var tooHardLabel = document.createElement('label');
        tooHardLabel.innerHTML = 'Too hard';
//        exMaxBlock.appendChild(tooHardLabel);
        let tooHardToggle = document.createElement('input');
        tooHardToggle.type = 'checkbox';
        tooHardToggle.checked = props.get(ex.name + '_relax', "0") === "1";
//        exMaxBlock.appendChild(tooHardToggle);

        if (i > 0) {
            let restExEl = document.createElement('div');
            restExEl.innerHTML = templates.restExTemplate;
            trainingPlan.appendChild(restExEl);
        }

        var exWork = document.createElement('div');
        exWork.classList.add('ex-work-container');
        trainingPlan.appendChild(exWork);
        lbl = document.createElement('div');
        lbl.classList.add('ex-work-title');
        lbl.innerText = exTitle;
        exWork.appendChild(lbl);

        var repsData = [];
        for (var j = 0; j < ex.repCoeffs.length; j++) {
            if (j > 0) {
                let restRepEl = document.createElement('div');
                restRepEl.innerHTML = templates.restRepTemplate;
                exWork.appendChild(restRepEl);
            }
            var repParams = {
                repIdx: (j + 1),
                repCntId: 'calc_rep_' + i + '_' + j
            };
            var repContainer = document.createElement('div');
            exWork.appendChild(repContainer);
            repContainer.innerHTML = Mustache.render(templates.repTemplate, repParams);
            repsData.push({
                element: document.getElementById(repParams.repCntId),
                coeff: ex.repCoeffs[j],
                unit: ex.unit
            });
        }

        let changer = getInputChangeHandler(maxInput, globalTooHardToggle, chooseDayElement, ex.levels, repsData);
        maxInput.onchange = function() {
            changer();
            props.set(ex.name, maxInput.value);
        };
        tooHardToggle.onchange = function() {
            changer();
            props.set(ex.name + '_relax', tooHardToggle.checked ? "1" : "0");
        };
        repCntChangers.push(changer);
    }
    let compositeChanger = composeChanger(repCntChangers);

    let globalTooHardContainer = document.createElement('div');
    globalTooHardContainer.align = 'right';
    globalTooHardContainer.classList.add('global-too-hard-container');
    userInput.appendChild(globalTooHardContainer);
    globalTooHardToggle.type = 'checkbox';
    globalTooHardContainer.appendChild(globalTooHardToggle);
    let globalTooHardLabel = document.createElement('label');
    globalTooHardLabel.innerText = 'Мне всё-равно тяжело';
    globalTooHardContainer.appendChild(globalTooHardLabel);
    globalTooHardToggle.checked = props.get('global_relax', "0") === "1";
    globalTooHardToggle.onchange = function() {
        compositeChanger();
        props.set('global_relax', globalTooHardToggle.checked ? "1" : "0");
    };

    if (chooseDayElement) {
        chooseDayElement.onchange = function() {
            compositeChanger();
            props.set('dayId', chooseDayElement.selectedIndex);
        };
    }
    compositeChanger();
}

function composeChanger(changers) {
    return function() {
        for (var i = 0; i < changers.length; i++) {
            changers[i]();
        }
    };
}

function getInputChangeHandler(maxInput, tooHardToggle, chooseDayElement, levels, repsData) {
    return function() {
        for (let i = 0; i < repsData.length; i++) {
            let rd = repsData[i];
            let dayCoeff = chooseDayElement ? chooseDayElement.value : 1;
            let quant = calcReps(maxInput.value, tooHardToggle.checked, levels, rd.coeff, dayCoeff);
            rd.element.value = quant + ' ' + rd.unit;
        }
    };
}

function calcReps(max, tooHard, levels, repCoeff, dayCoeff) {
    var cnt = 0;
    for (var i = 0; i < levels.length; i++) {
        var lvl = levels[i];
        if (max < lvl.bound) {
            break;
        }
        cnt = max * lvl.coeff;
    }
    var relaxCoeff = tooHard ? 0.9 : 1;
    return Math.round(cnt * repCoeff * dayCoeff * relaxCoeff);
}

function userProperties(prefix) {
    return {
        get: function(key, dflt) {
            var v = localStorage.getItem(prefix + key);
            return v == null ? dflt : v;
        },
        set: function(key, value) {
            localStorage.setItem(prefix + key, value);
        }
    };
}