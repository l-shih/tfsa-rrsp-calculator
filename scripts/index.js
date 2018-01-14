$(function() {
  var personalAmt = (10208 + 11635) / 2;

  var taxTable = [
    {limit: 38898, rate: 0.2006, amtTaxed(){
      return (this.limit - personalAmt) * this.rate;
    }},
    {limit: 45916, rate: 0.2270, amtTaxed(){
      return (this.limit - taxTable[0].limit) * this.rate;
    }},
    {limit: 77797, rate: 0.2820, amtTaxed(){
      return (this.limit - taxTable[1].limit) * this.rate;
    }},
    {limit: 89320, rate: 0.3100, amtTaxed(){
      return (this.limit - taxTable[2].limit) * this.rate;
    }},
    {limit: 91831, rate: 0.3279, amtTaxed(){
      return (this.limit - taxTable[3].limit) * this.rate;
    }},
    {limit: 108460, rate: 0.3829, amtTaxed(){
      return (this.limit - taxTable[4].limit) * this.rate;
    }},
    {limit: 142353, rate: 0.4070, amtTaxed(){
      return (this.limit - taxTable[5].limit) * this.rate;
    }},
    {limit: 202800, rate: 0.4370, amtTaxed(){
      return (this.limit - taxTable[6].limit) * this.rate;
    }},
    {limit: Infinity, rate: 0.4770}
  ];

  /**
   * Initializer function, runs once page has been loaded
   * 
   */
  function main() {
    
    $("#incomeNow").on("input", function() {
      let grossIncome = $("#incomeNow").val();
      $(".current-marginal-rate").text(((taxCalc(taxTable, grossIncome).margTaxRate) * 100).toFixed(2));
      $(".marginal-rate-explain").text((taxCalc(taxTable, grossIncome).margTaxRate * 1).toFixed(2));
    });

    $("#incomeRetire").on("input", function() {
      let grossIncome = $("#incomeNow").val();
      $(".retire-avg-rate").text(((taxCalc(taxTable, grossIncome).avgTaxRate) * 100).toFixed(2));
    });

    $(".btn").on("click", function() {
      var depositAmt = $("#invest-amt").val();
      var investYrs = $("#invest-years").val();
      var investRate = $("#invest-rate").val();
      var inflationRate = $("#inflation-rate").val();

      var grossIncome = $("#income-now").val();
      var retireIncome = $("#income-retire").val();
      var taxOnGross = taxCalc(taxTable, grossIncome).taxPaid;
      var grossAfterRRSP = grossIncome - depositAmt;
      var taxAfterRRSP = taxCalc(taxTable, grossAfterRRSP).taxPaid;
      var rrspTaxReturn = taxOnGross - taxAfterRRSP;
      var rrspDeposit = Number(depositAmt) + Number(rrspTaxReturn);
      var futureValueRRSP = futureValue(rrspDeposit, investRate, inflationRate, investYrs);
      var futureValueTFSA = futureValue(depositAmt, investRate, inflationRate, investYrs);

      var margTaxRate = (taxCalc(taxTable, grossIncome).margTaxRate); 
      var avgTaxRate = (taxCalc(taxTable, grossIncome).avgTaxRate);

      if(!depositAmt || !investYrs || !investRate || !inflationRate || !grossIncome || !retireIncome) {
        $("#calculated-info").empty().append(`<h4>Oops, it looks like you're missing some information</h4>`);
      } else {
        $("#calculated-info").empty().append(`
          <p class="rendered-info">The table below shows how your money can grow over time. Hover over the question marks to learn more.</p> 
          <table class="table table-striped">
          <thead>
            <tr>
                <th></th>
                <th>TFSA</th>
                <th>RRSP</th>
            </tr>
          </thead>
          <tbody class="comparison-table">
            <tr>
              <th scope="row">Deposit Amt <i class="fa fa-question-circle deposit-amt-explain" title="By depositing money in to an RRSP, you reduce your income to be taxed. This is why your RRSP deposit amount is higher than your TFSA amount"></i> </th>
              <td>$ ${depositAmt}</td>
              <td>$ ${rrspDeposit.toFixed(2)}</td>
            </tr>
            <tr>
              <th scope="row">Value after ${investYrs} years at ${investRate}% <i class="fa fa-question-circle fv-amt-explain" title="This amount takes in to account the inflation rate, which will reduce your exected investment rate"</i> </th>
              <td>$ ${futureValueTFSA.toFixed(2)}</td>
              <td>$ ${futureValueRRSP.toFixed(2)}</td>
            </tr>
            <tr>
              <th scope="row">Tax at withdrawal (est. ${(avgTaxRate * 100).toFixed(2)}%) <i class="fa fa-question-circle fv-tax-amt-explain" title="This only applies to your RRSP amount. Your TFSA amount was already taxed above"></i> </th>
              <td>-$ 0</td>
              <td>-$ ${(futureValueRRSP * avgTaxRate).toFixed(2)}</td>
            </tr>
            <tr>
              <th scope="row">Total savings</th>
              <td>$ ${futureValueTFSA.toFixed(2)}</td>
              <td>$ ${(futureValueRRSP - (futureValueRRSP * avgTaxRate)).toFixed(2)}</td>
            </tr>
          </tbody>
          </table>
        `);
      }
    });
  }

  /**
   * Caclulates both average tax and marginal tax using the tax table above
   * 
   * @param {object} taxTable 
   * @param {integer} grossIncome 
   * @returns {object}
   */
  function taxCalc(taxTable, grossIncome) {
    var trailingTax = 0;
    var trailingIncome = 0;
    var tax = 0;
    var bracket = 0;
    var nextBracket = 0;
    var avgTax = 0;
    if(grossIncome < personalAmt) {
      return { avgTaxRate: 0, margTaxRate: 0 };
    }
    for (var b = taxTable.length - 1; b >= 0; b--) {
      if (taxTable[b].limit < grossIncome) {
        bracket = b + 1;
        nextBracket = b;
        break;
      }  
    }
    trailingIncome = grossIncome - taxTable[nextBracket].limit;
    trailingTax = trailingIncome * taxTable[nextBracket].rate;
    for (var t = nextBracket; t >= 0; t--) {
      tax += taxTable[t].amtTaxed();
    }
    tax = tax + trailingTax;
    avgTax = tax / grossIncome;
    return { avgTaxRate: avgTax.toFixed(4), margTaxRate: taxTable[bracket].rate.toFixed(4), taxPaid: tax.toFixed(2) };
  }

  /**
   * Calculates the value of the amount deposited at time of withdrawl
   * taking in to account inflation rate by using the realRateOfReturn formula
   * @param {integer} presentValue 
   * @param {float} annualInvestRate 
   * @param {float} inflationRate 
   * @param {integer} years 
   * @returns {float}
   */
  function futureValue(presentValue, annualInvestRate, inflationRate, years) {
    var nominalRate = annualInvestRate / 100;
    var inflRate = inflationRate / 100;
    var investRate = realRateOfReturn(nominalRate, inflRate);
    return presentValue * Math.pow((1 + investRate), years);
  }

  /**
   * Calculates Real Rate of Return. This takes the user's desired annual growth
   * rate and factors in inflation
   * @param {float} annualInvestRate
   * @param {float} inflationRate
   * @returns {float}
   */
  function realRateOfReturn(annualInvestRate, inflationRate) {
    return ((1 + annualInvestRate) / (1 + inflationRate)) - 1;
  }

  main();

});



