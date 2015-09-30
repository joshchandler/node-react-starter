import React from 'react';
import { canUseDOM } from 'fbjs/lib/ExecutionEnvironment';


export default class Footer {
  setState() {
    viewport: canUseDOM
  }
  render() {
    var viewport = canUseDOM ? '<p>True</p>' : '<p>False</p>';
    return (
      <div className="footer">
        {viewport}
      </div>
    );
  }
}
