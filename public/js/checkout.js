const selectRegion = document.querySelector("#region");
const selectprovince = document.querySelector("#province");
const selectcity = document.querySelector("#city");
const selectbarangay = document.querySelector("#barangay");
selectprovince.disabled = true;
selectcity.disabled = true;
selectbarangay.disabled = true;

Philippines.regions.forEach(
    (op) => (selectRegion.innerHTML += `<option value="${op.reg_code}">${op.name}</option>`)
);

let address = {
    region: '',
    province: '',
    city: '',
    barangay: '',
    phonenumber: '',
    fullname: '',
    street: '',
    zipcode: ''
};

function showRegion(r) {
    selectprovince.innerHTML= `<option style="display: none" value="">Province</option>  `
    if(r.length > 0 ){
        Philippines.regions.forEach(op => {
            if (op.reg_code === r) {
                address.region = op.name;
            }
        });
        selectprovince.disabled = false;
        let reg=Philippines.getProvincesByRegion(r);
        for(let i=1; i <reg.length; i++){
            selectprovince.innerHTML += `<option value="${reg[i].prov_code}" name="${reg[i].name}">${reg[i].name}</option>`
        }
    }else{
        selectprovince.disabled = true;
    }
}



function showProvince(p) {
    selectcity.innerHTML= `<option style="display: none" value="">City</option>  `
    if(p.length > 0 ){
        Philippines.provinces.forEach(prov => {
            if (prov.prov_code === p) {
                address.province = prov.name;
            }
        });
    selectcity.disabled = false;
    Philippines.getCityMunByProvince(p).forEach(
        (op) => (selectcity.innerHTML += `<option value="${op.mun_code}">${op.name}</option>`)
    );
    }   else    {
        selectcity.disabled = true;
}

}

function showCity(c) {
    selectbarangay.innerHTML= `<option style="display: none" value="">Barangay</option>  `
    if(c.length > 0 ){
        Philippines.city_mun.forEach(city => {
            if (city.mun_code === c) {
                address.city = city.name;
            }
        });
    selectbarangay.disabled = false;
    Philippines.getBarangayByMun(c).forEach(
        (op) => (selectbarangay.innerHTML += `<option value="${op.name}">${op.name}</option>`)
    );
    } else {
        selectbarangay.disabled = true;
    }
}


function showBarangay(b) {
    address.barangay = b;
}


//payment methods

let payamentType = "Gcash";
let qrcodeSource = "/img/gcashqr.jpg";
const gcashBtn = document.getElementById("gcashButton");
const paymayaButton = document.getElementById("paymayaButton");
const unionButton = document.getElementById("unionButton");
const bpiButton = document.getElementById("bpiButton");
const bdoButton = document.getElementById("bdoButton");

const saveButton = document.getElementById("placeOrder");

gcashBtn.addEventListener('click', function() {
    gcashBtn.setAttribute("style", "background-color: #d2985e; color: white; padding: 0.8rem;");
    paymayaButton.setAttribute("style", "border: 1px solid #d2985e; padding: 1rem; color: #d2985e;");
    unionButton.setAttribute("style", "border: 1px solid #d2985e; padding: 1rem; color: #d2985e;");
    bpiButton.setAttribute("style", "border: 1px solid #d2985e; padding: 1rem; color: #d2985e;");
    bdoButton.setAttribute("style", "border: 1px solid #d2985e; padding: 1rem; color: #d2985e;");
    payamentType = "Gcash";
    qrcodeSource = "/img/gcashqr.jpg";
})

paymayaButton.addEventListener('click', function() {
    gcashBtn.setAttribute("style", "border: 1px solid #d2985e; padding: 1rem; color: #d2985e;");
    paymayaButton.setAttribute("style", "background-color: #d2985e; color: white; padding: 0.8rem;");
    unionButton.setAttribute("style", "border: 1px solid #d2985e; padding: 1rem; color: #d2985e;");
    bpiButton.setAttribute("style", "border: 1px solid #d2985e; padding: 1rem; color: #d2985e;");
    bdoButton.setAttribute("style", "border: 1px solid #d2985e; padding: 1rem; color: #d2985e;");
    payamentType = "Paymaya";
    qrcodeSource = "/img/paymayaqr.jpg";
})

unionButton.addEventListener('click', function() {
    gcashBtn.setAttribute("style", "border: 1px solid #d2985e; padding: 1rem; color: #d2985e;");
    paymayaButton.setAttribute("style", "border: 1px solid #d2985e; padding: 1rem; color: #d2985e;");
    unionButton.setAttribute("style", "background-color: #d2985e; color: white; padding: 0.8rem;");
    bpiButton.setAttribute("style", "border: 1px solid #d2985e; padding: 1rem; color: #d2985e;");
    bdoButton.setAttribute("style", "border: 1px solid #d2985e; padding: 1rem; color: #d2985e;");
    payamentType = "Union Bank";
    qrcodeSource = "/img/unionbankqr.jpg";
})

bpiButton.addEventListener('click', function() {
    gcashBtn.setAttribute("style", "border: 1px solid #d2985e; padding: 1rem; color: #d2985e;");
    paymayaButton.setAttribute("style", "border: 1px solid #d2985e; padding: 1rem; color: #d2985e;");
    unionButton.setAttribute("style", "border: 1px solid #d2985e; padding: 1rem; color: #d2985e;");
    bpiButton.setAttribute("style", "background-color: #d2985e; color: white; padding: 0.8rem;");
    bdoButton.setAttribute("style", "border: 1px solid #d2985e; padding: 1rem; color: #d2985e;");
    payamentType = "BPI";
    qrcodeSource = "/img/bpiqr.jpg";
})

bdoButton.addEventListener('click', function() {
    gcashBtn.setAttribute("style", "border: 1px solid #d2985e; padding: 1rem; color: #d2985e;");
    paymayaButton.setAttribute("style", "border: 1px solid #d2985e; padding: 1rem; color: #d2985e;");
    unionButton.setAttribute("style", "border: 1px solid #d2985e; padding: 1rem; color: #d2985e;");
    bpiButton.setAttribute("style", "border: 1px solid #d2985e; padding: 1rem; color: #d2985e;");
    bdoButton.setAttribute("style", "background-color: #d2985e; color: white; padding: 0.8rem;");
    payamentType = "BDO";
    qrcodeSource = "/img/bdoqr.jpg";
})

saveButton.addEventListener('click', function() {
    $('#payment-dialog').modal();
})

$('#payment-dialog').on('show.bs.modal', function (event) {
    var modal = $(this)
    modal.find('.modal-title').text(payamentType + " Payment");
    modal.find('.qrcode-img').attr('src', qrcodeSource);
})

const homeButton = document.getElementById("homeAddress");
const workButton = document.getElementById("workAddress");

homeButton.addEventListener('click', function() {
    homeButton.setAttribute("style", "background-color: #d2985e; color: white; padding: 1rem;");
    workButton.setAttribute("style", "border: 1px solid #d2985e; padding: 1rem;");
})

workButton.addEventListener('click', function() {
    workButton.setAttribute("style", "background-color: #d2985e; color: white; padding: 1rem;");
    homeButton.setAttribute("style", "border: 1px solid #d2985e; padding: 1rem;");
})

let addressTitle = "Address Saved successfully";
let addressMessage = address.street + ' ' + address.barangay + ', ' + address.city + ' ' + address.province + ' ' + address.region;
$('#address-dialog').on('show.bs.modal', function (event) {
    var modal = $(this)
    modal.find('.modal-title').text(addressTitle);
    modal.find('.modal-body p').text(addressMessage);
})

const saveAddress = document.getElementById("saveAddress");
saveAddress.addEventListener('click', function() {
    address.fullname = document.getElementById("fname").value;
    address.phonenumber = document.getElementById("phonenumber").value;
    address.street = document.getElementById("street").value;
    address.zipcode = document.getElementById("zipcode").value;

    console.log(address);
    $.ajax({
        url: "/sleekskincare/address",
        contentType: "application/json",
        data: JSON.stringify({ 
            region: address.region,
            province: address.province,
            city: address.city,
            barangay: address.barangay,
            phonenumber: address.phonenumber,
            fullname: address.fullname,
            street: address.street,
            zipcode: address.zipcode
         }),
        method: "POST",
        success: function (res) {
          if (res.status == "err") {
            addressTitle = "Failed to Save Address";
            addressMessage = "Please make sure to fill all the neccessary information. Thank you!"
            $('#address-dialog').modal();      
          }
          else{
            addressTitle = "Address Saved successfully";
            addressMessage = address.street + ' ' + address.barangay + ', ' + address.city + ' ' + address.province + ' ' + address.region;
            $('#address-dialog').modal();  
          }
        },
    });
})

