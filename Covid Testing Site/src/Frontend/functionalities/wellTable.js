const $tableID = $('#table');
const $BTN = $('#export-btn');
const $EXPORT = $('#export');

let inputPoolBarcode = "";

function fetchSavedWellTesting() {
    return fetch("http://localhost:8080/queryDB/wellTesting").then(result => {
        return result.json();
    }).then(function (data) {
        return data;
    }).catch((error) => {
        console.log(error);
        return null;
    });
}

async function displayWellTesting() {
    const $clone = $tableID.find('tbody tr').last().clone(true).removeClass('hide table-line');
    let savedWells = await fetchSavedWellTesting();
    if (savedWells == null) return;

    if ($tableID.find('tbody tr').length === 0) {
        for(let i = 0; i < savedWells.length; i++) {
            let result = savedWells[i]["result"];
            const newTr = `
                    <tr class="hide" id=${savedWells[i]["wellBarcode"]}>
                        <td class="pt-3-half"><p>${savedWells[i]["wellBarcode"]}</p>
                        <td class="pt-3-half"><p>${savedWells[i]["poolBarcode"]}</p>
                        <td class="pt-3-half">
                            <select class="custom-select d-block w-100" id="result-options" name="${i}-result" required>
                                <option>In progress</option>
                                <option>Negative</option>
                                <option>Positive</option>
                            </select>  
                        </td>
                        <td>
                            <span class="table-remove"><button type="button" class="btn btn-danger btn-rounded btn-sm my-0 waves-effect waves-light">Remove</button></span>
                        </td>
                    </tr>`;
                    
            $('tbody').append(newTr);
            $(`select[name="${i}-result"]`).find(`option:contains(${result})`).attr("selected",true);
        }
    }
    $tableID.find('table').append($clone);
}


displayWellTesting();

function deleteWellBy(wellBarcode) {
    return fetch(`http://localhost:8080/deleteWell/${wellBarcode}`).then(result => {
        return result;
    }).catch((error) => {
        console.log(error);
        return null;
    });
}

async function deleteSavedWell(element, wellID) {
    let result = await deleteWellBy(wellID);
    console.log(result);
    if(result == null || result.status >= 400) {
        alert("Something went wrong! Try again.");
        return;
    }
    $(element).parents('tr').detach();
}

function editWellBy(wellBarcode, newResult) {
    return fetch(`http://localhost:8080/editWell/${wellBarcode}/${newResult}`).then(result => {
        return result;
    }).catch((error) => {
        console.log(error);
        return null;
    });
}

async function editSavedWell(wellID, newResult) {
    let result = await editWellBy(wellID, newResult);
    console.log(result);
    if(result == null || result.status >= 400) {
        alert("Something went wrong! Try again.");
        return;
    }
    alert("Successfully edited wells.");
}

document.getElementById("edit-well-button").onclick = () => {
    $('table > tbody  > tr').each(function(index, tr) { 
        let wellBarcode = tr.cells[0].querySelector("p").innerHTML;
        let dropdownCell = tr.cells[2].querySelector('#result-options');
        let chosenResult = dropdownCell.options[dropdownCell.selectedIndex].text;
        editSavedWell(wellBarcode, chosenResult);
     });
};

$("#add-well-button").onclick = () => {
    displayWellTesting();
};

$tableID.on('click', '.table-remove', async function () {
    let wellID = $(this).parents('tr').attr('id');
    console.log(wellID);
    deleteSavedWell(this, wellID);
});

$tableID.on('click', '.table-up', function () {
    const $row = $(this).parents('tr');
    
    if ($row.index() === 0) {
        return;
    }

    $row.prev().before($row.get(0));
});

$tableID.on('click', '.table-down', function () {
    const $row = $(this).parents('tr');
    $row.next().after($row.get(0));
});

// A few jQuery helpers for exporting only
jQuery.fn.pop = [].pop;
jQuery.fn.shift = [].shift;

$BTN.on('click', () => {
    const $rows = $tableID.find('tr:not(:hidden)');
    const headers = [];
    const data = [];

    // Get the headers (add special header logic here)
    $($rows.shift()).find('th:not(:empty)').each(function () {
        headers.push($(this).text().toLowerCase());
    });

    // Turn all existing rows into a loopable array
    $rows.each(function () {
        const $td = $(this).find('td');
        const h = {};

        // Use the headers from earlier to name our hash keys
        headers.forEach((header, i) => {
            h[header] = $td.eq(i).text();
        });

        data.push(h);
    });

    // Output the result
    $EXPORT.text(JSON.stringify(data));
});