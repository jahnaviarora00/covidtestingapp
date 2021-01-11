const $tableID = $('#table');
const $BTN = $('#export-btn');
const $EXPORT = $('#export');

function fetchSavedTests() {
    return fetch("http://localhost:8080/queryDB/all").then(result => {
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
    let fetchTestList = await fetchSavedTests();
    if (fetchTestList == null) return;
    
    if ($tableID.find('tbody tr').length === 0) {
        for (let i = 0; i < fetchTestList.length; i++) {
            const newTr = `
                <tr class="hide" id="${fetchTestList[i]["testBarcode"]}">
                    <td class="pt-3-half">${fetchTestList[i]["employeeID"]}</td>
                    <td class="pt-3-half">${fetchTestList[i]["testBarcode"]}</td>
                    <td>
                        <span class="table-remove"><button type="button" class="btn btn-danger btn-rounded btn-sm my-0 waves-effect waves-light">Remove</button></span>
                    </td>
                </tr>`;
            $('tbody').append(newTr);
        }
    }
    $tableID.find('table').append($clone);
}

function deleteTestBy(barcodeID) {
    return fetch(`http://localhost:8080/deleteTest/${barcodeID}`).then(result => {
        return result;
    }).catch((error) => {
        console.log(error);
        return null;
    });
}

async function deleteSavedTest(element, barcodeID) {
    let result = await deleteTestBy(barcodeID);
    console.log(result);
    if(result == null) return;
    $(element).parents('tr').detach();
}

displaySavedTests();

$('#form-submit').on('click', async () => {
    displaySavedTests();
});

$tableID.on('click', '.table-remove', async function () {
    let testID = $(this).parents('tr').attr('id');
    console.log(testID);
    deleteSavedTest(this, testID);
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