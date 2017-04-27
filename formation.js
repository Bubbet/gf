
const TYPES = ["hg", "smg", "ar", "rf", "mg", "sg"];
const GRIDS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
const CHAR_LEVEL_EQUIPMENT = [20, 50, 80];

var mPickerType = "";
var mPickerEquipmentIndex = "";
var mEquipmentData = "";
var mStringData = "";
var mCharData = [];
var mGridOrder = [];
var mFormation = [];
var mGridToUI = [];
var mGridToChar = [];
var mGridHasChar = [];

function init() {
    initFormation();
    initData();
    initDialog();

    $('.add_button').click(function() {
        openDialogPicker($(this).attr("grid_value"));
    });

    $('.char .img').addClass("hover").click(function() {
        openDialogPicker($(this).attr("grid_value"));
    });

    $('.char .level').change(function() {
        updateCharObs();
        updateEquipmentUIByGrid($(this).attr("grid_value"));
        updateUI();
    });

    $('.equipment_container select').change(function() {
        updateCharObs();
        updateUI();
    });

    $('.char .skill_level').change(function() {
        updateCharObs();
        updateUI();
    });

    $('.char .skill_control').change(function() {
        updateCharObs();
        updateUI();
    });

    $('.enemy_control .enemyDodge').change(function() {
        updateCharObs();
        updateUI();
    });

    $(".grid_container").draggable({revert: "invalid", helper: "clone"});

    $(".grid_container").droppable({
        accept: ".grid_container",
        activeClass: "ui-state-hover",
        hoverClass: "ui-state-active",
        drop: function(event, ui) {

            var draggable = ui.draggable, droppable = $(this),
                dragPos = draggable.position(), dropPos = droppable.position();

            draggable.css({
                left: dropPos.left+'px',
                top: dropPos.top+'px'
            });

            droppable.css({
                left: dragPos.left+'px',
                top: dragPos.top+'px'
            });
            draggable.swap(droppable);
            swapGridUI(draggable, droppable);
            updateCharObs();
            updateUI();
        }
    });

    $('.view_equipment').change(function() {
        if ($(this).is(":checked")) {
            for (var i in GRIDS) {
                if (mGridToChar[GRIDS[i]] != "") {
                    var charObj = mGridToChar[GRIDS[i]];
                    var uiObj = getGridUiObj(GRIDS[i]);
                    uiObj.find(".char").hide();
                    uiObj.find('.equipment_container').show();
                }
            }
        } else {
            for (var i in GRIDS) {
                if (mGridToChar[GRIDS[i]] != "") {
                    var charObj = mGridToChar[GRIDS[i]];
                    var uiObj = getGridUiObj(GRIDS[i]);
                    uiObj.find(".char").show();
                    uiObj.find('.equipment_container').hide();
                }
            }
        }
    });

    $('.button.close').click(function() {
        $('#picker').dialog("close");
        $('#picker_by_type').dialog("close");
        $('#picker_equipment').dialog("close");
    });

    var pre = getUrlParameter('pre');
    if (pre) {
        var formation = JSON.parse(pre);
        $.each(formation, function(key, val) {
            var controlUI = getGridUiObj(""+val.g).find(".control_container");
            var equipmentUI = getGridUiObj(""+val.g).find(".equipment_container");
            controlUI.find(".level").val(val.lv);
            controlUI.find(".skill_level").val(val.slv);
            addChar(val.g, val.id);
            for (var i in val.eq) {
                var e = val.eq[i];
                addEquipment(val.g, e.i, e.id);
                equipmentUI.find(".equipment_strengthen_"+e.i).val(e.lv);
            }
        });
    }

    $('.aura_container').hover(function(){
        $('#detail').dialog({position: {my: "left top", at: "right top", of: $(this)}});
        $(".detail_container").html("");

        var charObj = mGridToChar[getUiElementGridValue($(this))];
        var aura = charObj.aura;
        var text = mStringData[aura.target] + "<br>";
        var auraText = [];
        $.each(getAuraEffectByLink(aura.effect, charObj.c.link), function(key, val) {
            auraText.push(mStringData[key] + val + "%");
        });
        text = text + auraText.join(", ");
        $(".detail_container").html(text);
        $('#detail').dialog("open");
    }, function(){
        $('#detail').dialog("close");
    });
}

function getUiElementGridValue(e) {
    return e.attr("grid_value");
}

function getGridUiObj(grid) {
    return $("." + mGridToUI[grid]);
}

function initDialog() {
    $('#picker').dialog({autoOpen: false, width: 'auto', modal : true});
    $('#picker_equipment').dialog({autoOpen: false, width: 'auto', modal : true});
    $('#picker_by_type').dialog({autoOpen: false, width: 'auto', modal : true});
    $('#picker_by_type').dialog({position: {my: "left top", at: "right top", of: ".formation"}});
    $('#picker_equipment').dialog({position: {my: "left top", at: "right top", of: ".formation"}});
    $('#detail').dialog({autoOpen: false, width: 'auto'});

    var row = $('<tr></tr>');
    for (var i in TYPES) {
        var v = TYPES[i];
        var item = $('<div></div>').addClass("button hover").html(v).attr("value", v).click(function() {
            openDialogPickerByType($(this).attr("value"));
        });
        $('<td></td>').append(item).appendTo(row);
    }

    $('#picker table').append(row);

    $('#picker .remove').click(function() {
        removeChar(mPickerGrid);
    });

    $('#picker_equipment .remove').click(function() {
        removeEquipment(mPickerGrid, mPickerEquipmentIndex);
    });
}

function removeChar(grid) {
    $("." + mGridToUI[grid] + " .add_button").show();
    $("." + mGridToUI[grid] + " .char").hide();

    $('#picker').dialog("close");
    mGridToChar[grid] = "";
    updateCharObs();

    var g = getGridUiObj(grid).attr("grid_value");
    mGridHasChar = $.grep(mGridHasChar, function(e) {return e != g;});
    updateUI();
}

function removeEquipment(grid, equipmentIndex) {
    $('#picker_equipment').dialog("close");

    var charObj = mGridToChar[grid];
    charObj.equipment[equipmentIndex] = "";
    updateEquipmentUIByGrid(grid);

    updateCharObs();
    updateUI();
}

function initFormation() {
    mGridOrder.push(["7", "8", "9"]);
    mGridOrder.push(["4", "5", "6"]);
    mGridOrder.push(["1", "2", "3"]);
    for (var i in mGridOrder) {
        var row = $('<tr></tr>');

        for (var j in mGridOrder[i]) {
            var order = mGridOrder[i][j];
            var item = $('.factory .grid_container').clone().addClass("grid_container_" + order).attr("grid_value", order)
                    .find(".add_button").attr("grid_value", order).end()
                    .find(".img").attr("grid_value", order).end()
                    .find(".level").attr("grid_value", order).end()
                    .find(".skill_level").attr("grid_value", order).end()
                    .find(".skill_control").attr("grid_value", order).end()
                    .find(".aura_container").attr("grid_value", order).end()
                    .find(".equipment").attr("grid_value", order).end()
                    .find(".equipment_1").attr("equipment_index", "1").end()
                    .find(".equipment_2").attr("equipment_index", "2").end()
                    .find(".equipment_3").attr("equipment_index", "3").end()
                    .find(".char").attr("grid_value", order).end();
            $('<td></td>').addClass("grid").append(item).appendTo(row);

            mGridToUI[order] = "grid_container_" + order;
            mGridToChar[order] = "";
        }

        $('.tab_formation .formation').append(row);
    }

    for (var i = 1; i <= 5; i++) {
        var item = $('.factory .char_performance').clone().addClass("char_performance_" + i);
        $('.performance_container').append(item);
    }
}

function swapGridUI(a, b) {
    var aClass = "";
    a.classes(function(c) {
        if (c.includes("grid_container_")) {
            aClass = c;
        }
    });

    var bClass = "";
    b.classes(function(c) {
        if (c.includes("grid_container_")) {
            bClass = c;
        }
    });

    swapArrayElements(mGridToChar, mGridToUI.indexOf(aClass), mGridToUI.indexOf(bClass));
    swapArrayElements(mGridToUI, mGridToUI.indexOf(aClass), mGridToUI.indexOf(bClass));
}

function openDialogPicker(grid) {
    mPickerGrid = getGridByUIValue(grid);
    $('#picker').dialog("open");
    $('#picker').dialog({position: {my: "left top", at: "center", of: ".grid_container_" + grid}});
    $('#picker_by_type').dialog("close");
}

function getGridByUIValue(v) {
    return mGridToUI.indexOf("grid_container_" + v);
}

function openDialogPickerByType(type) {
    $('#picker_by_type').dialog("open");
    $('#picker').dialog("close");

    for (var i = 5; i >= 2; i--) {
        var count = 0;

        var rows = [];
        var row = $('<tr></tr>');
        var grepList = $.grep(mCharData, function(e) {return e.type == type && e.rarity == i;});
        grepList.forEach(function(v) {
            var item = $('<div></div>').addClass("button hover rarity_"+i).html(v.name).attr("value", v.id).click(function() {
                addChar(mPickerGrid, $(this).attr("value"));
            });

            $('<td></td>').append(item).appendTo(row);

            count++;
            if (count % 5 == 0) {
                rows.push(row);
                row = $('<tr></tr>');
                count = 0;
            }
        });
        rows.push(row);

        $("#picker_by_type .rarity_"+i+" table").html("");
        $("#picker_by_type .rarity_"+i+" table").append(rows);
    }
}

function initData() {
    $.ajaxSetup({
        async: false
    });
    $.getJSON("char.json", function(data) {
        $.each(data.chars, function(key, val) {
            mCharData.push(val);
        });
    }).fail(function() {
        alert("load json data fail");
    });

    $.getJSON("equipment.json", function(data) {
        mEquipmentData = data;
    }).fail(function() {
        alert("load json data fail");
    });
    $.getJSON("string.json", function(data) {
        mStringData = data.string;
    }).fail(function() {
        alert("load json data fail");
    });
}

function addChar(grid, id) {
    $('#picker_by_type').dialog("close");
    $('#picker').dialog("close");

    $("." + mGridToUI[grid] + " .add_button").hide();
    $("." + mGridToUI[grid] + " .char .img").html(getCharImgUIObj(id));
    if ($('.view_equipment').is(":checked")) {
        $("." + mGridToUI[grid] + " .char").hide();
        $("." + mGridToUI[grid] + " .equipment_container").show();
    } else {
        $("." + mGridToUI[grid] + " .char").show();
        $("." + mGridToUI[grid] + " .equipment_container").hide();
    }

    mGridToChar[grid] = getChar(id);
    var auraUI = $("." + mGridToUI[grid] + " .aura_container");
    var equipmentUI = $("." + mGridToUI[grid] + " .equipment_container");
    updateCharObs();
    updateAuraUI(auraUI, mGridToChar[grid]);
    updateEquipmentUI(equipmentUI, mGridToChar[grid]);

    var g = getGridUiObj(grid).attr("grid_value");
    if (mGridHasChar.indexOf(g) >= 0) {

    } else {
        mGridHasChar.push(g);
    }
    updateUI();
}

function updateEquipmentUIByGrid(grid) {
    var equipmentUI = $("." + mGridToUI[grid] + " .equipment_container");
    var charObj = mGridToChar[grid];
    updateEquipmentUI(equipmentUI, charObj);
}

function getEquipmentById(id) {
    var grepList = $.grep(mEquipmentData.equipment, function(e){return e.id == id;});
    return grepList[0];
}

function updateEquipmentUI(equipmentUI, charObj) {
    var charType = charObj.type;
    var charLevel = charObj.c.level;
    var classificationList = getEquipmentClassificationOfChar(charObj);

    for (var i in CHAR_LEVEL_EQUIPMENT) {
        var ii = i*1 + 1;
        if (charLevel >= CHAR_LEVEL_EQUIPMENT[i]) {
            var text = mStringData[classificationList[ii]];
            if (charObj.equipment[ii] != "") {
                text = getEquipmentById(charObj.equipment[ii]).name;
            }
            equipmentUI.find(".equipment_"+ii).html(text).click(function() {
                openDialogPickerEquipment($(this).attr("equipment_index"), $(this).attr("grid_value"));
            });
        } else {
            equipmentUI.find(".equipment_"+ii).html("Lv."+CHAR_LEVEL_EQUIPMENT[i]+mStringData.unlock).off('click');
        }
    }
}

function openDialogPickerEquipment(index, grid) {
    mPickerGrid = getGridByUIValue(grid);
    mPickerEquipmentIndex = index;
    $('#picker_equipment').dialog("open");
    var equipmentUI = $("." + mGridToUI[mPickerGrid] + " .equipment_container");
    var charObj = mGridToChar[mPickerGrid];

    var charType = charObj.type;
    var charLevel = charObj.c.level;
    var classificationList = getEquipmentClassificationOfChar(charObj);

    var classification = classificationList[mPickerEquipmentIndex];

    var grepList = $.grep(mEquipmentData.equipment_type, function(e){
        var isSameClassification = e.classification == classification;
        if (!isSameClassification) return false;
        if ('can_char' in e) {
            if (e["can_char"].indexOf(charObj.id) >= 0) {
                return true;
            }
        }
        if ('can_type' in e) {
            if (e["can_type"].indexOf(charObj.type) >= 0 || e["can_type"].indexOf("all") >= 0) {
                return true;
            } else {
                return false;
            }
        }
        if ('can_not_type' in e) {
            if (e["can_not_type"].indexOf(charObj.type) >= 0) {
                return false;
            } else {
                return true;
            }
        }
        return true;
    });

    var equipmentTypeList = $.map(grepList, function(item) {
        return item.type;
    });

    var alreadyEquipmentTypeList = [];
    for (var i = 1; i <= 3; i++) {
        if (charObj.equipment[i] != "" && i != mPickerEquipmentIndex) {
            alreadyEquipmentTypeList.push(getEquipmentById(charObj.equipment[i]).type);
        }
    }

    equipmentTypeList = $.grep(equipmentTypeList, function(v) {
        for (var i in alreadyEquipmentTypeList) {
            if (alreadyEquipmentTypeList[i] == v) {
                return false;
            }
        }
        return true;
    });

    grepList = $.grep(mEquipmentData.equipment, function(e){
        var isSameType = equipmentTypeList.indexOf(e.type) >= 0;
        var canLevel = 1;
        if (e.rarity == "3") canLevel = 30;
        if (e.rarity == "4") canLevel = 45;
        if (e.rarity == "5") canLevel = 60;
        var isCanLevel = charObj.c.level >= canLevel;
        if ('can_char' in e) {
            return e["can_char"].indexOf(charObj.id) >= 0 && isSameType && isCanLevel;
        } else {
            return isSameType && isCanLevel;
        }
    });

    var equipmentList = grepList;

    for (var i = 5; i >= 2; i--) {
        var count = 0;

        var rows = [];
        var row = $('<tr></tr>');
        grepList = $.grep(equipmentList, function(e) {return e.rarity == i;});
        grepList.forEach(function(v) {
            var item = $('<div></div>').addClass("button hover rarity_"+i).html(v.name).attr("value", v.id).click(function() {
                addEquipment(mPickerGrid, mPickerEquipmentIndex, $(this).attr("value"));
                $('#picker_equipment').dialog("close");
            });

            $('<td></td>').append(item).appendTo(row);

            count++;
            if (count % 5 == 0) {
                rows.push(row);
                row = $('<tr></tr>');
                count = 0;
            }
        });
        rows.push(row);

        $("#picker_equipment .rarity_"+i+" table").html("");
        $("#picker_equipment .rarity_"+i+" table").append(rows);
    }
}

function addEquipment(grid, equipmentIndex, id) {
    var charObj = mGridToChar[grid];
    charObj.equipment[equipmentIndex] = id;
    updateEquipmentUIByGrid(grid);

    updateCharObs();
    updateUI();
}

function getCharObjByGrid(grid) {
    return mGridToChar[grid];
}

function getEquipmentClassificationOfChar(charObj) {
    var classificationList = "";
    var grepList = $.grep(mEquipmentData.char_can_equipment_type, function(e){return e.type == charObj.type;});
    classificationList = grepList[0];

    grepList = $.grep(mEquipmentData.char_can_equipment_type, function(e){return e.char == charObj.id;});
    if (grepList.length > 0) {
        classificationList = grepList[0];
    }

    return classificationList.classification_type;
}

function updateAuraUI(auraUI, charObj) {
    grids = getAuraGridFromChar(charObj);
    var selfGrid = 5;
    if ('self' in charObj.aura) {
        selfGrid = getGridFromXY(charObj.aura["self"]);
    }

    for (var i = 1; i <= 9; i++) {
        if (grids.indexOf(i) >= 0) {
            auraUI.find(".aura_" + i).css("background-color", "#00FFDC");
        } else if (i == selfGrid) {
            auraUI.find(".aura_" + i).css("background-color", "white");
        } else {
            auraUI.find(".aura_" + i).css("background-color", "#6A6A6A");
        }
    }
}

function getGridFromXY(val) {
    var grid = 0;
    if (val.x == "0" && val.y == "0") {
        grid = 5;
    }
    if (val.x == "0" && val.y == "1") {
        grid = 2;
    }
    if (val.x == "0" && val.y == "-1") {
        grid = 8;
    }
    if (val.x == "1" && val.y == "0") {
        grid = 6;
    }
    if (val.x == "1" && val.y == "1") {
        grid = 3;
    }
    if (val.x == "1" && val.y == "-1") {
        grid = 9;
    }
    if (val.x == "-1" && val.y == "0") {
        grid = 4;
    }
    if (val.x == "-1" && val.y == "1") {
        grid = 1;
    }
    if (val.x == "-1" && val.y == "-1") {
        grid = 7;
    }

    return grid;
}

function xyToGrid(x, y) {
    var grid = -1;
    if (x == "0" && y == "0") {
        grid = 5;
    }
    if (x == "0" && y == "1") {
        grid = 2;
    }
    if (x == "0" && y == "-1") {
        grid = 8;
    }
    if (x == "1" && y == "0") {
        grid = 6;
    }
    if (x == "1" && y == "1") {
        grid = 3;
    }
    if (x == "1" && y == "-1") {
        grid = 9;
    }
    if (x == "-1" && y == "0") {
        grid = 4;
    }
    if (x == "-1" && y == "1") {
        grid = 1;
    }
    if (x == "-1" && y == "-1") {
        grid = 7;
    }

    return grid;
}

function getAuraGridFromChar(charObj) {
    var grids = [];
    $.each(charObj.aura.grid, function(key, val) {
        grids.push(getGridFromXY(val));
    });

    return grids;
}

function getCharImgUIObj(id) {
    var img = $('<img>').attr("src","assets/n/" + id + ".png");
    return img;
}

function updateUI() {
    var index = 1;
    for (var i in mGridHasChar) {
        var grid = getGridByUIValue(mGridHasChar[i]);
        if (mGridToChar[grid] != "") {
            var charObj = mGridToChar[grid];

            var skillAttack = "-";
            if (charObj.c.skillAttack != 0) {
                skillAttack = charObj.c.skillAttack.toFixed(2);
            }

            var cp = $(".char_performance_" + index);
            cp.find(".value.name").html(charObj.name).end()
            .find(".value.hp").html(charObj.c.hp).end()
            .find(".value.dmg").html(charObj.c.dmg).end()
            .find(".value.hit").html(charObj.c.hit).end()
            .find(".value.dodge").html(charObj.c.dodge).end()
            .find(".value.fireOfRate").html(charObj.c.fireOfRate).end()
            .find(".value.criRate").html(charObj.c.criRate).end()
            .find(".value.skillAttack").html(skillAttack).end()
            .find(".value.dps").html(charObj.c.dps.toFixed(2)).end();
            index++;
        }
    }

    while (index <= 5) {
        var cp = $(".char_performance_" + index);
        cp.find(".value.name").html("-").end()
        .find(".value.hp").html("-").end()
        .find(".value.dmg").html("-").end()
        .find(".value.hit").html("-").end()
        .find(".value.dodge").html("-").end()
        .find(".value.fireOfRate").html("-").end()
        .find(".value.criRate").html("-").end()
        .find(".value.skillAttack").html("-").end()
        .find(".value.dps").html("-").end();
        index++;
    }

    var formation = [];
    for (var i in mGridHasChar) {
        var grid = getGridByUIValue(mGridHasChar[i]);
        if (mGridToChar[grid] != "") {
            var charObj = mGridToChar[grid];

            var charRow = {};
            charRow.g = grid;
            charRow.id = charObj.id;
            charRow.lv = charObj.c.level;
            charRow.slv = charObj.c.skillLevel;
            charRow.eq = charObj.equipment_code;
            formation.push(charRow);

            var cp = $(".char_performance_" + index);
            cp.find(".value.name").html(charObj.name).end()
            .find(".value.hp").html(charObj.c.hp).end()
            .find(".value.dmg").html(charObj.c.dmg).end()
            .find(".value.hit").html(charObj.c.hit).end()
            .find(".value.dodge").html(charObj.c.dodge).end()
            .find(".value.fireOfRate").html(charObj.c.fireOfRate).end()
            .find(".value.criRate").html(charObj.c.criRate).end()
            .find(".value.skillAttack").html(skillAttack).end()
            .find(".value.dps").html(charObj.c.dps.toFixed(2)).end();
            index++;
        }
    }
    var url = [location.protocol, '//', location.host, location.pathname].join('');
    $("#code").val(url + "?pre=" + JSON.stringify(formation));
}

function charGetAttrByLevel(attr, lv) {
    var v = ((1.0 * attr["100"] - 1.0 * attr["1"]) / 99 * (lv - 1) + attr["1"] * 1.0);
    return parseInt(v);
}

function getChar(id){
    var grepList = $.grep(mCharData, function(e){return e.id == id;});
    var obj = JSON.parse(JSON.stringify(grepList[0]));
    obj["criRate"] = 20;
    obj["equipment"] = [];
    obj["equipment"][1] = "";
    obj["equipment"][2] = "";
    obj["equipment"][3] = "";
    if (obj.type == "rf" || obj.type == "sg") obj["criRate"] = 40;
    if (obj.type == "smg" || obj.type == "mg") obj["criRate"] = 5;
    if (obj.id == "114") obj["criRate"] = 40;
    return obj;
}

function updateCharObs() {
    for (var i in GRIDS) {
        if (mGridToChar[GRIDS[i]] != "") {
            var charObj = mGridToChar[GRIDS[i]];
            var controlUI = $("." + mGridToUI[GRIDS[i]] + " .control_container");
            var equipmentUI = $("." + mGridToUI[GRIDS[i]] + " .equipment_container");

            charObj.c = {};
            charObj.c.level = parseInt(controlUI.find(".level").val());
            charObj.c.skillLevel = parseInt(controlUI.find(".skill_level").val());
            charObj.c.link = getLink(charObj.c.level);
            charObj.c.hp = charGetAttrByLevel(charObj.hp, charObj.c.level);
            charObj.c.dmg = charGetAttrByLevel(charObj.dmg, charObj.c.level);

            charObj.c.hit = charGetAttrByLevel(charObj.hit, charObj.c.level);
            charObj.c.dodge = charGetAttrByLevel(charObj.dodge, charObj.c.level);
            charObj.c.fireOfRate = charGetAttrByLevel(charObj.fireOfRate, charObj.c.level);
            charObj.c.criRate = charObj.criRate;

            charObj.c.aura_dmg = 0;
            charObj.c.aura_hit = 0;
            charObj.c.aura_dodge = 0;
            charObj.c.aura_fireOfRate = 0;
            charObj.c.aura_criRate = 0;
            charObj.c.skillAttack = 0;

            if (charObj.c.level < 80) charObj.equipment[3] = "";
            if (charObj.c.level < 50) charObj.equipment[2] = "";
            if (charObj.c.level < 20) charObj.equipment[1] = "";
            charObj.equipment_code = [];
            for (var zi = 1; zi <= 3; zi++) {
                if (charObj.equipment[zi] != "") {
                    var eObj = getEquipmentById(charObj.equipment[zi]);
                    var strengthenLevel = parseInt(equipmentUI.find(".equipment_strengthen_"+zi).val());

                    var eq_code = {};
                    eq_code.i = zi;
                    eq_code.id = charObj.equipment[zi];
                    eq_code.lv = strengthenLevel;
                    charObj.equipment_code.push(eq_code);


                    $.each(eObj.effect, function(key, val) {
                        var strengthenCoefficient = eObj.strengthenCoefficient;
                        if ('strengthenCoefficient' in val) {
                            strengthenCoefficient = val.strengthenCoefficient;
                        }
                        if (val.max > 0) {
                            charObj.c[key] += Math.floor(val.max * 1 * (1 + strengthenLevel * strengthenCoefficient));
                        } else {
                            charObj.c[key] += val.max * 1;
                        }
                    });
                }
            }
        }
    }

    var ally = [];
    for (var i in GRIDS) {
        var grid = GRIDS[i];
        if (mGridToChar[grid] != "") {
            var charObj = mGridToChar[grid];
            ally.push(charObj);

            var aura = charObj.aura;
            var selfPos = gridToXY(grid);

            var auraSelfX = "0";
            var auraSelfY = "0";
            if ('self' in aura) {
                auraSelfX = aura["self"].x;
                auraSelfY = aura["self"].y;
            }

            $.each(aura.grid, function(key, val) {
                var diffX = parseInt(val.x) - parseInt(auraSelfX);
                var diffY = parseInt(val.y) - parseInt(auraSelfY);


                var targetX = selfPos.x + diffX;
                var targetY = selfPos.y + diffY;
                var targetGrid = xyToGrid(targetX, targetY);
                if (targetGrid != -1) {
                    var targetObj = mGridToChar[targetGrid];
                    if (targetObj != "" && (targetObj.type == aura.target || aura.target == "all")) {
                        $.each(getAuraEffectByLink(aura.effect, charObj.c.link), function(key, val) {
                            targetObj.c["aura_" + key] += val;
                        });
                    }
                }
            });


        }
    }

    for (var i in GRIDS) {
        if (mGridToChar[GRIDS[i]] != "") {
            var charObj = mGridToChar[GRIDS[i]];

            charObj.c.dmg = Math.floor(charObj.c.dmg * (1 + 0.01 * charObj.c.aura_dmg));
            charObj.c.hit = Math.floor(charObj.c.hit * (1 + 0.01 * charObj.c.aura_hit));
            charObj.c.dodge = Math.floor(charObj.c.dodge * (1 + 0.01 * charObj.c.aura_dodge));
            charObj.c.fireOfRate = Math.floor(charObj.c.fireOfRate * (1 + 0.01 * charObj.c.aura_fireOfRate));
            charObj.c.criRate = Math.floor(charObj.c.criRate * (1 + 0.01 * charObj.c.aura_criRate));
        }
    }

    for (var i in GRIDS) {
        if (mGridToChar[GRIDS[i]] != "") {
            var charObj = mGridToChar[GRIDS[i]];
            var controlUI = $("." + mGridToUI[GRIDS[i]] + " .control_container");

            if (controlUI.find(".skill_control").is(":checked")) {
                var skill = charObj.skill;
                var skillEffect = getSkillByLevel(skill.effect, charObj.c.skillLevel);
                if (skill.type == "buff") {
                    if (skill.target == "ally") {
                        updateForSkill(skillEffect, ally);
                    } else if (skill.target == "self") {
                        var t = [];
                        t.push(charObj);
                        updateForSkill(skillEffect, t);
                    }
                } else if (skill.type == "attack") {
                    charObj.c.skillAttack = skillEffect.attack;
                }

            }
        }
    }

    var enemyDodge = $('.enemy_control .enemyDodge').val();
    if (enemyDodge == "") {
        enemyDodge = 0;
    }

    for (var i in GRIDS) {
        if (mGridToChar[GRIDS[i]] != "") {
            var charObj = mGridToChar[GRIDS[i]];

            if (1 == 1) {
                charObj.c.dmg += 2;
            }
            //charObj.c.dmg = Math.floor(charObj.c.dmg * (1 + 0.01 * charObj.c.aura_dmg));
            //charObj.c.hit = Math.floor(charObj.c.hit * (1 + 0.01 * charObj.c.aura_hit));
            //charObj.c.dodge = Math.floor(charObj.c.dodge * (1 + 0.01 * charObj.c.aura_dodge));
            //charObj.c.fireOfRate = Math.floor(charObj.c.fireOfRate * (1 + 0.01 * charObj.c.aura_fireOfRate));
            charObj.c.fireOfRate = Math.min(charObj.c.fireOfRate, 120);
            //charObj.c.criRate = Math.floor(charObj.c.criRate * (1 + 0.01 * charObj.c.aura_criRate));
            charObj.c.criRate = Math.min(charObj.c.criRate, 100);

            charObj.c.attackFrame = Math.ceil(50.0 / charObj.c.fireOfRate * 30.0);
            var hitRate = charObj.c.hit / (charObj.c.hit + enemyDodge * 1.0);
            charObj.c.dps = charObj.c.dmg * 30.0 / charObj.c.attackFrame * (1 - charObj.c.criRate * 0.01 + 1.5 * charObj.c.criRate * 0.01) * hitRate;
            if ('attackTimes' in charObj.c) {
                charObj.c.dps = charObj.c.dps * charObj.c.attackTimes;
            }
            charObj.c.skillAttack = charObj.c.skillAttack * charObj.c.dmg;
        }
    }
}

function getAuraEffectByLink(auraEffect, link) {
    var l = {};
    $.each(auraEffect, function(key, val) {
        var e = Math.floor((1 * val["5"] - 1 * val["1"]) / 4 * (link - 1) + 1 * val["1"]);
        l[key] = e;
    });

    return l;
}

function getSkillByLevel(skillEffect, skillLevel) {
    var l = {};
    $.each(skillEffect, function(key, val) {
        if (skillLevel in val) {
            if (val[skillLevel] == "") {

            } else {
                l[key] = val[skillLevel] * 1.0;
            }
        } else {
            if (val["10"] == "" || val["1"] == "") {

            } else {
                var e = (1.0 * val["10"] - 1.0 * val["1"]) / 9.0 * (skillLevel - 1.0) + 1.0 * val["1"];
                l[key] = e;
            }
        }
    });

    return l;
}

function updateForSkill(skillEffect, targetObjs) {
    $.each(skillEffect, function(key, val) {
        if (key != "time") {
            for (var i in targetObjs) {
                var t = targetObjs[i];
                if (key == "attackTimes") {
                    t.c[key] = val * 1.0;
                } else {
                    t.c[key] = parseInt(t.c[key] * (1 + 0.01 * val));
                }
            }
        }
    });
}

function getLink(level) {
    if (level >= 90) return 5;
    if (level >= 70) return 4;
    if (level >= 30) return 3;
    if (level >= 10) return 2;
    return 1;
}

function gridToXY(grid) {
    var pos = {};
    if (grid == "7") {
        pos.x = -1;
        pos.y = -1;
    }
    if (grid == "8") {
        pos.x = 0;
        pos.y = -1;
    }
    if (grid == "9") {
        pos.x = 1;
        pos.y = -1;
    }
    if (grid == "4") {
        pos.x = -1;
        pos.y = 0;
    }
    if (grid == "5") {
        pos.x = 0;
        pos.y = 0;
    }
    if (grid == "6") {
        pos.x = 1;
        pos.y = 0;
    }
    if (grid == "1") {
        pos.x = -1;
        pos.y = 1;
    }
    if (grid == "2") {
        pos.x = 0;
        pos.y = 1;
    }
    if (grid == "3") {
        pos.x = 1;
        pos.y = 1;
    }

    return pos;
}


jQuery.fn.swap = function(b){
    // method from: http://blog.pengoworks.com/index.cfm/2008/9/24/A-quick-and-dirty-swap-method-for-jQuery
    b = jQuery(b)[0];
    var a = this[0];
    var t = a.parentNode.insertBefore(document.createTextNode(''), a);
    b.parentNode.insertBefore(a, b);
    t.parentNode.insertBefore(b, t);
    t.parentNode.removeChild(t);
    return this;
};

;!(function ($) {
    $.fn.classes = function (callback) {
        var classes = [];
        $.each(this, function (i, v) {
            var splitClassName = v.className.split(/\s+/);
            for (var j = 0; j < splitClassName.length; j++) {
                var className = splitClassName[j];
                if (-1 === classes.indexOf(className)) {
                    classes.push(className);
                }
            }
        });
        if ('function' === typeof callback) {
            for (var i in classes) {
                callback(classes[i]);
            }
        }
        return classes;
    };
})(jQuery);

var swapArrayElements = function(arr, indexA, indexB) {
      var temp = arr[indexA];
        arr[indexA] = arr[indexB];
          arr[indexB] = temp;
};

var getUrlParameter = function getUrlParameter(sParam) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1)),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : sParameterName[1];
        }
    }
};
//alert(JSON.stringify(charObj));