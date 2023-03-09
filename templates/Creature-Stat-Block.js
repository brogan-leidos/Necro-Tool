var pbByCrMap = {
'0':'+2',
'1/8':'+2',
'1/4':'+2',
'1/2':'+2',
'1':'+2',
'2':'+2',
'3':'+2',
'4':'+2',
'5':'+3',
'6':'+3',
'7':'+3',
'8':'+3',
'9':'+4',
'10':'+4',
'11':'+4',
'12':'+4',
'13':'+5',
'14':'+5',
'15':'+5',
'16':'+5',
'17':'+6',
'18':'+6',
'19':'+6',
'20':'+6',
'21':'+7',
'22':'+7',
'23':'+7',
'24':'+7',
'25':'+8',
'26':'+8',
'27':'+8',
'28':'+8',
'29':'+9',
'30':'+9',
}

export function titleCase(str) {
    str = str.toLowerCase();
    str = str.split(' ');
    for (var i = 0; i < str.length; i++) {
      str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1); 

    }
    return str.join(' ');
}

export function drillDownValue(creatureJson, value) {
    var currentLevel = creatureJson[value];
    while(true) {
        var oldValue = currentLevel;
        if (typeof(oldValue) === 'string' || typeof(oldValue) === 'number') {
            return oldValue;
        }
        currentLevel = currentLevel[0] ?? currentLevel[value] ?? currentLevel;
        if (oldValue === currentLevel || !currentLevel) {
            break;
        }        
    }
    return oldValue;
}

function replaceTags(text) {
    return text.replace(/\{@h\}\d+/g, '')
        .replace(/\{@atk \w+\}/g, '')
        .replace(/\{@recharge \w+\}/g, '')
        .replace(/\{@([^\s]+)\s([^}]+)\}/g, '<$1>$2</$1>')
        .replace(/\w+\|\|(\w+)/g, '$1');
}

var numberToSpellLevelMap = {
    0: 'Cantrips (at will)',
    1: '1st level',
    2: '2nd level',
    3: '3rd level',
    4: '4th level',
    5: '5th level',
    6: '6th level',
    7: '7th level',
    8: '8th level',
    9: '9th level',
}


export function getCreatureStatBlock(creatureJson) {
    var cr = creatureJson['cr'];
    var pb = `${pbByCrMap[creatureJson['cr']]}`;
    if (cr['cr']) {
        pb = '';
        var keys = Object.keys(cr);
        var crString = '';
        keys.forEach(key => {
            crString += `${key}: ${cr[key]}, `
            pb += `${pbByCrMap[cr[key]]}, `;
        });
        cr = crString.substring(0, crString.length -1);
        pb = pb.substring(0, pb.length - 1);
    }       

    var type = creatureJson['type'];
    if (type['type']) {
        type = type['type'];
    }
    var actions = '';
    if (creatureJson['action']) {
        actions += `<div class="section-title">Actions</div>`;
        actions += `<div class="actions">`;
        for (let action of creatureJson['action']) {
            action["name"] = action["name"].replace(' {@recharge}', '');
            actions += `<div><b id="stat-block-${action['name']}">${action['name']}</b>:`;
            for (let entry of action['entries']) {
                if (entry['items']) {
                    for (let item of entry['items']) {
                        if (item['entries']) {
                            actions += `<div><span class="${item['style']} ${item['type']}">${item['name']}:</span>`;
                            actions += `${item['entries'].join('\n')}`;                            
                            actions += `</div>`;
                        } else {                        
                            actions += `<div><span class="${item['style']} ${item['type']}">${item['name']}:</span> ${item['entry']}</div>`;
                        }
                    }
                } else {
                    actions += `${entry}`
                }
            }
            actions += `</div>`;                                                            
        }
        actions = replaceTags(actions);
        actions += "</div>";
    }

    var traits = '';
    if (creatureJson['trait']) {
        traits += `<div class="section-title">Traits</div>`;
        traits += `<div class="traits">`;
        for (let trait of creatureJson['trait']) {
            traits += `<div><b>${trait['name']}</b>: ${trait['entries'].join('\n  ')}</div>`;
        }
        traits = replaceTags(traits);
        traits += "</div>";
    }

    var senses = '';
    if (creatureJson['senses']){    
        senses = creatureJson['senses'].join(', ');
    }

    var languages = '';
    if (creatureJson['languages']){    
        languages = creatureJson['languages'].join(', ');
    }

    var immunities = '';
    if (creatureJson['immune']) {
        immunities = creatureJson['immune'].join(', ');
    }

    var resistances = '';
    if (creatureJson['resist']) {
        if (creatureJson['resist']['resist']) {
            resistances = `${creatureJson['resist']['resist'].join(' ,')} ${creatureJson['resist']['note']}`
        } else {
            resistances = creatureJson['resist'].join(', ');
        }
    }

    var skills = '';
    
    if (creatureJson['skill']) {
        var skillsList = [];    
        var skillKeys = Object.keys(creatureJson['skill']);
        for (let skill of skillKeys) {
            skillsList.push(`${skill} ${creatureJson['skill'][skill]}`);
        }
        skills = `<div class="skills"><b>Skills</b> ${skillsList.join(', ')}</div>`
    }

    var saves = '';
    if (creatureJson['save']) {
        var keys = Object.keys(creatureJson['save']);
        keys.forEach(key => {
            saves += creatureJson['save'][key] + ', '
        });
        saves = saves.substring(0, saves.length - 2);
    }

    var speedArray = [];
    var speedKeys = Object.keys(creatureJson['speed']);
    for (let speed of speedKeys) {
        if (creatureJson['speed'][speed]['condition']) {
            speedArray.push(`${speed} ${creatureJson['speed'][speed]['condition']} ${creatureJson['speed'][speed]['number']}`);
        } else {
            speedArray.push(`${speed} ${creatureJson['speed'][speed]}`);
        }        
    }

    var spellcasting = "";
    if (creatureJson['spellcasting']?.length > 0) {
        spellcasting += "<div>"
        for (let spellContainer of creatureJson['spellcasting']) {
            var spellName = spellContainer['name'];
            var entry = replaceTags(spellContainer['headerEntries'][0]);
            spellcasting += `<div class="spell-entry"><b>${spellName}</b>: ${entry}</div>`;

            // Parse out spell slot casters (lich for example)
            if (spellContainer['spells']) {
                var length = Object.keys(spellContainer['spells']).length;
                for (var i=0; i < length; i++) {
                    var header = numberToSpellLevelMap[i];
                    var spellList = [];
                    var slots = i === 0 ? '' : ` (${spellContainer['spells'][i]['slots']} slots)`;
                    for (let spellname of spellContainer['spells'][i]['spells']) {
                        spellList.push(replaceTags(spellname));
                    }                    
                    spellcasting += `<div class="spell-level">${header}${slots}: ${spellList.join(', ')}</div>`;
                }
            } 
            // Parse out innate casters (elementals, Dao)
            else if (spellContainer['daily']) {
                if (spellContainer['innate']) {
                    spellcasting += `<div>${spellContainer['innate'].map(spell => replaceTags(spell)).join(', ')}</div>`;
                }

                if (spellContainer['will']) {
                    spellcasting += `<div><span class="item">At Will: </span> `
                    spellcasting += `${spellContainer['will'].map(spell => replaceTags(spell)).join(', ')}`;
                    spellcasting += '</div>';
                }
                
                var keys = Object.keys(spellContainer['daily']);
                for (let key of keys) {
                   var dailySpells = spellContainer['daily'][key];
                   var numberPerDay = key.substring(0,1);
                   spellcasting += `<div><span class="item">${numberPerDay}/Day</span> `
                   spellcasting += `${dailySpells.map(spell => replaceTags(spell)).join(', ')}`;
                   spellcasting += '</div>';
                }
                

            }
        }
        spellcasting += "</div>"
    }

    var legendary = '';
    if (creatureJson['legendary']) {
        legendary += `<div class="section-title">Legendary Actions</div>`
        legendary += '<div class="legendary">'
        for(var i=0; i < creatureJson['legendary'].length; i++) {
            var actionName =  creatureJson['legendary'][i]['name'];
            var actionEffect = creatureJson['legendary'][i]['entries'][0];
            legendary += `<div class="legendary-action"><b>${actionName}.</b> ${replaceTags(actionEffect)}</div>`
        }
        legendary += '</div>'

    }
    

    return `
<div class="creature-stat-block">
    <div class="flex-row flex-align-space-between">
        <div class="creature-name">${creatureJson['name']}</div>
        <div><button id="statBlockCloseButton">&times;</button></div>
    </div>
    <div class="creature-type">${titleCase(drillDownValue(creatureJson, 'type'))}</div>
    <table class="creature-header-stats">
        <tr>
            <td>Armor Class</td>
            <td>Hit points</td>
            <td>Speed</td>
            <td>CR</td>
            <td>PB</td>
        </td>
        <tr>
            <td>${drillDownValue(creatureJson, 'ac')}</td>
            <td>${creatureJson['hp']['average']} (${creatureJson['hp']['formula']})</td>
            <td>${speedArray.join(', ')} ft</td>
            <td>${cr}</td>
            <td>${pb}</td>
        </tr>
    </table>
    <div class="stat-spread">
        <table>
            <tr>
                <td>STR</td>
                <td>DEX</td>
                <td>CON</td>
                <td>INT</td>
                <td>WIS</td>
                <td>CHR</td>
            </tr>
            <tr>
                <td>${creatureJson['str']} (${getModifierFromTotal(creatureJson['str'])})</td>
                <td>${creatureJson['dex']} (${getModifierFromTotal(creatureJson['dex'])})</td>
                <td>${creatureJson['con']} (${getModifierFromTotal(creatureJson['con'])})</td>
                <td>${creatureJson['int']} (${getModifierFromTotal(creatureJson['int'])})</td>
                <td>${creatureJson['wis']} (${getModifierFromTotal(creatureJson['wis'])})</td>
                <td>${creatureJson['cha']} (${getModifierFromTotal(creatureJson['cha'])})</td>
            </tr>
        </table>
    </div>
    ${skills}
    ${generateCreatureSection('Senses', senses)}
    ${generateCreatureSection('Languages', languages)}
    ${generateCreatureSection('Resistances', resistances)}
    ${generateCreatureSection('Immunities', immunities)}
    ${traits}
    ${spellcasting}
    ${actions}
    ${legendary}
</div>
`;
}

function generateCreatureSection(sectionName, jsonElement) {
    if (jsonElement !== '') {
        return `<div class="${sectionName}"><b>${sectionName}</b> ${jsonElement}</div>`;
    }
    return '';
}

function getModifierFromTotal(total) {
    if (total >= 10) {
        return `+${Math.floor((total - 10) / 2)}`;
    } else {
        return `-${Math.floor((total - 10) / 2)}`;
    }
}