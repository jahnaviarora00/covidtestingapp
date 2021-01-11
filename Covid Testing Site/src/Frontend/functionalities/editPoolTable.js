const $tableID = $('#table');
const $BTN = $('#export-btn');
const $EXPORT = $('#export');

function fetchSavedPools() {
    return fetch("http://localhost:8080/queryDB/savedPools").then(result => {
        return result.json();
    }).then(function (data) {
        return data;
    }).catch((error) => {
        console.log(error);
        return null;
    });
}

async function displaySavedTests() {
    const $clone = $tableID.find('tbody tr').last().clone(true).removeClass('hide table-line');
    let savedPools = await fetchSavedPools();
    console.log(savedPools);
    if (savedPools == null) return;

    if ($tableID.find('tbody tr').length === 0) {
        for (var key in savedPools) {
            if (savedPools.hasOwnProperty(key)) {
                const newTr = `
                    <tr class="hide" id="${key}">
                        <td class="pt-3-half"><p name="poolBarcode">${key}</p></td>
                        <td class="pt-3-half"><input class="edit-test" name="testBarcodeList" value=${savedPools[key]}></td>
                        <td>
                            <span class="table-remove"><button type="button" class="btn btn-danger btn-rounded btn-sm my-0 waves-effect waves-light">Remove</button></span>
                        </td>
                    </tr>`;
                $('tbody').append(newTr);
            }
        }
    }
    $tableID.find('table').append($clone);
}

function deleteTestBy(barcodeID) {
    return fetch(`http://localhost:8080/queryDB/deletePool/${barcodeID}`).then(result => {
        return result.json();
    }).catch((error) => {
        console.log(error);
        return null;
    });
}

async function deleteSavedTest(element, poolID) {
    let result = await deleteTestBy(poolID);
    console.log(result);
    if(result == null || result.status >= 400) {
        alert("Something went wrong! Try again.");
        return;
    }
    $(element).parents('tr').detach();
}

function editTestBarcode(poolBarcode, testBarcodeList) {
    return fetch(`http://localhost:8080/editPool/${poolBarcode}&${testBarcodeList}`).then(result => {
        return result;
    }).catch((error) => {
        console.log(error);
        return null;
    });
}

displaySavedTests();

$tableID.on('click', '.table-remove', async function () {
    let poolID = $(this).parents('tr').attr('id');
    console.log(poolID);
    deleteSavedTest(this, poolID);
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