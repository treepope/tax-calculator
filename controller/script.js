let currentStep = 0;
const totalSteps = 5;

// Tax brackets for 2024
const taxBrackets = [
  { min: 0, max: 150000, rate: 0 },
  { min: 150001, max: 300000, rate: 0.05 },
  { min: 300001, max: 500000, rate: 0.1 },
  { min: 500001, max: 750000, rate: 0.15 },
  { min: 750001, max: 1000000, rate: 0.2 },
  { min: 1000001, max: 2000000, rate: 0.25 },
  { min: 2000001, max: 5000000, rate: 0.3 },
  { min: 5000001, max: Infinity, rate: 0.35 },
];

function changeStep(step) {
  if (step < 0 || step >= totalSteps) return;

  // Hide current content
  document.querySelectorAll(".step-content").forEach((content) => {
    content.classList.add("hidden");
  });

  // Show new content
  document.getElementById(`content-${step}`).classList.remove("hidden");

  // Update step indicators
  for (let i = 0; i < totalSteps; i++) {
    const stepElement = document.getElementById(`step-${i}`);
    stepElement.classList.remove(
      "step-active",
      "step-completed",
      "step-inactive"
    );

    if (i < step) {
      stepElement.classList.add("step-completed");
    } else if (i === step) {
      stepElement.classList.add("step-active");
    } else {
      stepElement.classList.add("step-inactive");
    }
  }

  currentStep = step;
  updateNavigationButtons();

  if (step === 4) {
    calculateTax();
  }
}

function nextStep() {
  if (currentStep < totalSteps - 1) {
    changeStep(currentStep + 1);
  }
}

function previousStep() {
  if (currentStep > 0) {
    changeStep(currentStep - 1);
  }
}

function updateNavigationButtons() {
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");

  prevBtn.disabled = currentStep === 0;

  if (currentStep === totalSteps - 1) {
    nextBtn.textContent = "คำนวณใหม่";
    nextBtn.onclick = () => changeStep(0);
  } else {
    nextBtn.textContent = "ถัดไป →";
    nextBtn.onclick = nextStep;
  }
}

function updateTotalIncome() {
  const monthlySalary =
    parseFloat(document.getElementById("monthly-salary").value) || 0;
  const bonusSalary =
    parseFloat(document.getElementById("bonus-salary").value) || 0;
  const otherIncome =
    parseFloat(document.getElementById("other-income").value) || 0;

  const totalIncome = monthlySalary * 12 + bonusSalary + otherIncome;
  document.getElementById("total-income").textContent =
    totalIncome.toLocaleString() + " บาท";

  // Update social security automatically (5% of monthly salary, max 15,000/year)
  const socialSecurity = Math.min(monthlySalary * 12 * 0.05, 15000);
  document.getElementById("social-security").value = socialSecurity;

  updateDeductions();
}

function updateDeductions() {
  updateFamilyDeduction();
  updateInsuranceDeduction();
  updateFundDeduction();
}

function updateFamilyDeduction() {
  const maritalStatus = document.getElementById("marital-status").value;
  const spouseIncome = document.getElementById("spouse-income").value;
  const children = parseInt(document.getElementById("children").value) || 0;
  const parents = parseInt(document.getElementById("parents").value) || 0;

  let familyDeduction = 60000; // Personal allowance

  if (maritalStatus === "married" && spouseIncome === "no") {
    familyDeduction += 60000; // Spouse allowance
  }

  familyDeduction += children * 30000; // Children allowance
  familyDeduction += parents * 30000; // Parents allowance

  document.getElementById("family-deduction").textContent =
    familyDeduction.toLocaleString() + " บาท";
}

function updateInsuranceDeduction() {
  const lifeInsurance = Math.min(
    parseFloat(document.getElementById("life-insurance").value) || 0,
    100000
  );
  const healthInsurance = Math.min(
    parseFloat(document.getElementById("health-insurance").value) || 0,
    25000
  );
  const socialSecurity =
    parseFloat(document.getElementById("social-security").value) || 0;

  const insuranceDeduction = lifeInsurance + healthInsurance + socialSecurity;
  document.getElementById("insurance-deduction").textContent =
    insuranceDeduction.toLocaleString() + " บาท";
}

function updateFundDeduction() {
  const pvdFund = Math.min(
    parseFloat(document.getElementById("pvd-fund").value) || 0,
    500000
  );
  const rmfFund = Math.min(
    parseFloat(document.getElementById("rmf-fund").value) || 0,
    300000
  );
  const ltfFund = Math.min(
    parseFloat(document.getElementById("ltf-fund").value) || 0,
    200000
  );

  // RMF + LTF combined limit
  const rmfLtfCombined = Math.min(rmfFund + ltfFund, 500000);
  const fundDeduction = pvdFund + rmfLtfCombined;

  document.getElementById("fund-deduction").textContent =
    fundDeduction.toLocaleString() + " บาท";
}

function calculateTax() {
  // Get total income
  const monthlySalary =
    parseFloat(document.getElementById("monthly-salary").value) || 0;
  const bonusSalary =
    parseFloat(document.getElementById("bonus-salary").value) || 0;
  const otherIncome =
    parseFloat(document.getElementById("other-income").value) || 0;
  const totalIncome = monthlySalary * 12 + bonusSalary + otherIncome;

  // Get all deductions
  const familyDeduction = parseFloat(
    document
      .getElementById("family-deduction")
      .textContent.replace(/[^\d]/g, "")
  );
  const insuranceDeduction = parseFloat(
    document
      .getElementById("insurance-deduction")
      .textContent.replace(/[^\d]/g, "")
  );
  const fundDeduction = parseFloat(
    document.getElementById("fund-deduction").textContent.replace(/[^\d]/g, "")
  );

  // Calculate taxable income
  const taxableIncome = Math.max(
    0,
    totalIncome - familyDeduction - insuranceDeduction - fundDeduction
  );

  // Calculate tax using brackets
  let tax = 0;
  let taxBreakdown = [];

  for (const bracket of taxBrackets) {
    if (taxableIncome > bracket.min - 1) {
      const taxableInBracket =
        Math.min(taxableIncome, bracket.max) - bracket.min + 1;
      const taxInBracket = taxableInBracket * bracket.rate;
      tax += taxInBracket;

      if (taxInBracket > 0) {
        taxBreakdown.push({
          range: `${bracket.min.toLocaleString()} - ${
            bracket.max === Infinity ? "∞" : bracket.max.toLocaleString()
          }`,
          rate: (bracket.rate * 100).toFixed(0) + "%",
          taxableAmount: taxableInBracket.toLocaleString(),
          taxAmount: taxInBracket.toLocaleString(),
        });
      }
    }
  }

  const netIncome = totalIncome - tax;

  // Update results
  document.getElementById("tax-amount").textContent =
    tax.toLocaleString() + " บาท";
  document.getElementById("net-income").textContent =
    netIncome.toLocaleString() + " บาท";

  // Update breakdown
  const breakdownElement = document.getElementById("tax-breakdown");
  breakdownElement.innerHTML = `
                <div class="flex justify-between py-2 ">
                    <span>รายได้รวม:</span>
                    <span class="font-semibold">${totalIncome.toLocaleString()} บาท</span>
                </div>
                <div class="flex justify-between py-2 ">
                    <span>ลดหย่อนครอบครัว:</span>
                    <span class="font-semibold text-red-600">-${familyDeduction.toLocaleString()} บาท</span>
                </div>
                <div class="flex justify-between py-2 ">
                    <span>ลดหย่อนประกัน:</span>
                    <span class="font-semibold text-red-600">-${insuranceDeduction.toLocaleString()} บาท</span>
                </div>
                <div class="flex justify-between py-2 ">
                    <span>ลดหย่อนกองทุน:</span>
                    <span class="font-semibold text-red-600">-${fundDeduction.toLocaleString()} บาท</span>
                </div>
                <div class="flex justify-between py-2  font-semibold">
                    <span>รายได้สุทธิ:</span>
                    <span>${taxableIncome.toLocaleString()} บาท</span>
                </div>
                ${taxBreakdown
                  .map(
                    (item) => `
                    <div class="flex justify-between py-1 text-sm">
                        <span>${item.range} บาท (${item.rate}):</span>
                        <span>${item.taxAmount} บาท</span>
                    </div>
                `
                  )
                  .join("")}
                <div class="flex justify-between py-3 border-t-2 text-lg font-bold">
                    <span>ภาษีที่ต้องจ่ายรวม:</span>
                    <span class="text-blue-600">${tax.toLocaleString()} บาท</span>
                </div>
            `;
}

// Event listeners
document.addEventListener("DOMContentLoaded", function () {
  // Income inputs
  document
    .getElementById("monthly-salary")
    .addEventListener("input", updateTotalIncome);
  document
    .getElementById("bonus-salary")
    .addEventListener("input", updateTotalIncome);
  document
    .getElementById("other-income")
    .addEventListener("input", updateTotalIncome);

  // Family deduction inputs
  document
    .getElementById("marital-status")
    .addEventListener("change", function () {
      const spouseSection = document.getElementById("spouse-section");
      if (this.value === "married") {
        spouseSection.classList.remove("hidden");
      } else {
        spouseSection.classList.add("hidden");
      }
      updateFamilyDeduction();
    });

  document
    .getElementById("spouse-income")
    .addEventListener("change", updateFamilyDeduction);
  document
    .getElementById("children")
    .addEventListener("input", updateFamilyDeduction);
  document
    .getElementById("parents")
    .addEventListener("input", updateFamilyDeduction);

  // Insurance inputs
  document
    .getElementById("life-insurance")
    .addEventListener("input", updateInsuranceDeduction);
  document
    .getElementById("health-insurance")
    .addEventListener("input", updateInsuranceDeduction);

  // Fund inputs
  document
    .getElementById("pvd-fund")
    .addEventListener("input", updateFundDeduction);
  document
    .getElementById("rmf-fund")
    .addEventListener("input", updateFundDeduction);
  document
    .getElementById("ltf-fund")
    .addEventListener("input", updateFundDeduction);

  // Initialize
  updateTotalIncome();
});

// Keyboard navigation
document.addEventListener("keydown", function (e) {
  if (e.key === "ArrowRight" || e.key === "Enter") {
    if (currentStep < totalSteps - 1) nextStep();
  } else if (e.key === "ArrowLeft") {
    if (currentStep > 0) previousStep();
  }
});
