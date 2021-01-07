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
        for (let i = 0; i < model.weeks.length; i++) {
            let week = model.weeks[i];
            if (week.monthId == chooseMonthElement.value) {
                let weekOpt = document.createElement('option');
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

    let updateAll = function() {
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

    let chooseDayElement;
    if (model.days) {
        chooseDayElement = layoutCalendarInput(root, 'День');
        for (let i = 0; i < model.days.length; i++) {
            let dayModel = model.days[i];
            let dayOpt = document.createElement('option');
            dayOpt.innerHTML = dayModel.name;
            dayOpt.value = dayModel.coeff;
            chooseDayElement.appendChild(dayOpt);
        }
        chooseDayElement.selectedIndex = props.get('dayId', 0);
    }

    let templateCont = document.createElement('div');
    root.appendChild(templateCont);
  
    let renderedWeek = Mustache.render(templates.weekTemplate);
    templateCont.innerHTML = renderedWeek;

    let userInput = document.getElementById('calc-user-input');
    let trainingPlan = document.getElementById('calc-training-plan');
    let repCntChangers = [];
    let globalTooHardObjs = createTuningWidgets(['Мне всё-равно тяжело']);
    let globalTooHardToggle = globalTooHardObjs.toggles[0];
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

        let tuningObjs = createTuningWidgets(['Мне всё-равно тяжело', 'Мне слишком легко']);
//        userInput.appendChild(tuningObjs.container);
        let tooHardToggle = tuningObjs.toggles[0];
        let tooEasyToggle = tuningObjs.toggles[1];
        // t0d0 proper user properties
//        tooEasyToggle.checked = props.get(ex.name + '_harden', "0") === "1";

        if (i > 0) {
            let restExEl = document.createElement('div');
            restExEl.innerHTML = templates.restExTemplate;
            trainingPlan.appendChild(restExEl);
        }

        let exWork = document.createElement('div');
        exWork.classList.add('ex-work-container');
        trainingPlan.appendChild(exWork);
        lbl = document.createElement('div');
        lbl.classList.add('ex-work-title');
        lbl.innerText = exTitle;
        exWork.appendChild(lbl);

        let repsData = [];
        for (let j = 0; j < ex.repCoeffs.length; j++) {
            let restRepEl;
            if (j > 0) {
                restRepEl = document.createElement('div');
                restRepEl.innerHTML = templates.restRepTemplate;
                exWork.appendChild(restRepEl);
            }
            let repParams = {
                repIdx: (j + 1)
            };
            let repContainer = document.createElement('div');
            exWork.appendChild(repContainer);
            repContainer.innerHTML = Mustache.render(templates.repTemplate, repParams);
            let rd = {
                element: repContainer.getElementsByClassName('rep-count-field')[0],
                coeff: ex.repCoeffs[j],
                unit: ex.unit
            };
            if (restRepEl) {
              rd.restElement = restRepEl.getElementsByClassName('rest-rep-duration')[0];
            }
            repsData.push(rd);
        }

        let changer = getInputChangeHandler(maxInput, globalTooHardToggle, null, chooseDayElement, ex.levels, repsData);
        maxInput.onchange = function() {
            changer();
            props.set(ex.name, maxInput.value);
        };
        tooHardToggle.onchange = function() {
            if (tooHardToggle.checked) {
                tooEasyToggle.checked = false;
            }
            changer();
            // t0d0 proper user properties
//            props.set(ex.name + '_relax', tooHardToggle.checked ? "1" : "0");
        };
        tooEasyToggle.onchange = function() {
            if (tooEasyToggle.checked) {
                tooHardToggle.checked = false;
            }
            changer();
            // t0d0 proper user properties
        }
        repCntChangers.push(changer);
    }
    let compositeChanger = composeChanger(repCntChangers);

    userInput.appendChild(globalTooHardObjs.container);
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

function createTuningWidgets(labels) {
    let tuningContainer = document.createElement('div');
    tuningContainer.align = 'right';
    tuningContainer.classList.add('tuning-container');
    let toggles = [];
    for (let i = 0; i < labels.length; i++) {
        let tuningToggle = document.createElement('input');
        toggles.push(tuningToggle);
        tuningToggle.type = 'checkbox';
        tuningContainer.appendChild(tuningToggle);
        let tuningLabel = document.createElement('label');
        tuningLabel.innerText = labels[i];
        tuningContainer.appendChild(tuningLabel);
    }
    return {
        toggles: toggles,
        container: tuningContainer
    };
}

function composeChanger(changers) {
    return function() {
        for (let i = 0; i < changers.length; i++) {
            changers[i]();
        }
    };
}

function getInputChangeHandler(maxInput, tooHardToggle, tooEasyToggle, chooseDayElement, levels, repsData) {
    return function() {
        for (let i = 0; i < repsData.length; i++) {
            let rd = repsData[i];
            let dayCoeff = chooseDayElement ? chooseDayElement.value : 1;
            let tuningCoeff = 0;
            if (tooHardToggle && tooHardToggle.checked) {
                tuningCoeff = -1;
            }
            else if (tooEasyToggle && tooEasyToggle.checked) {
                tuningCoeff = 1;
            }
            let x = calcRepsRest(maxInput.value, tuningCoeff, levels, rd.coeff, dayCoeff);
            rd.element.value = x.reps + ' ' + rd.unit;
            if (rd.restElement) {
                rd.restElement.innerText = x.rest;
            }
        }
    };
}

function calcRepsRest(max, tuningCoeff, levels, repCoeff, dayCoeff) {
    let lvlcoeff = 0;
    for (let i = 0; i < levels.length; i++) {
        let lvl = levels[i];
        if (max < lvl.bound) {
            break;
        }
        lvlcoeff = lvl.coeff;
    }
    lvlcoeff = lvlcoeff + tuningCoeff * 0.1;
    return {
      reps: Math.round(max * lvlcoeff * repCoeff * dayCoeff),
      rest: lvlcoeff > 1 ? 3 : 2
    };
}

function userProperties(prefix) {
    return {
        get: function(key, dflt) {
            let v = localStorage.getItem(prefix + key);
            return v == null ? dflt : v;
        },
        set: function(key, value) {
            localStorage.setItem(prefix + key, value);
        }
    };
}
