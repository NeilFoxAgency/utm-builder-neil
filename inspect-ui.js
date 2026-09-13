(function () {
  'use strict';
  var input = document.getElementById('shipped');
  var result = document.getElementById('result');
  var status = document.getElementById('status');
  var inspectBtn = document.getElementById('inspect');

  function clearResult() {
    result.textContent = '';
    status.textContent = '';
  }

  function line(label, value) {
    var p = document.createElement('p');
    var strong = document.createElement('strong');
    strong.textContent = label + ': ';
    p.appendChild(strong);
    p.appendChild(document.createTextNode(value));
    return p;
  }

  function inspect() {
    clearResult();
    var report = window.NfaInspect.inspectExistingUrl(input.value);
    if (!report.ok) {
      status.textContent = report.error;
      return;
    }
    result.appendChild(line('Destination without UTMs', report.destination));
    result.appendChild(line('utm_source', report.params.utm_source || '(none)'));
    result.appendChild(line('utm_medium', report.params.utm_medium || '(none)'));
    result.appendChild(line('utm_campaign', report.params.utm_campaign || '(none)'));
    result.appendChild(line('utm_id', report.params.utm_id || '(none)'));
    result.appendChild(line('utm_term', report.params.utm_term || '(none)'));
    result.appendChild(line('utm_content', report.params.utm_content || '(none)'));
    if (report.warnings.length) {
      var heading = document.createElement('h2');
      heading.textContent = 'Warnings';
      result.appendChild(heading);
      var list = document.createElement('ul');
      report.warnings.forEach(function (warning) {
        var item = document.createElement('li');
        item.textContent = warning;
        list.appendChild(item);
      });
      result.appendChild(list);
      status.textContent = report.warnings.length + ' warning(s). Fields stay in this browser.';
    } else {
      status.textContent = 'No inspect warnings. Fields stay in this browser.';
    }
  }

  inspectBtn.addEventListener('click', inspect);
  input.addEventListener('input', clearResult);
})();
