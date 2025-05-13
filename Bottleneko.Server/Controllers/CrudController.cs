using Microsoft.AspNetCore.Mvc;

namespace Bottleneko.Server.Controllers;

public abstract class CrudController<TAddRequest, TUpdateRequest> : NekoController
{
    [HttpPut]
    public abstract Task<IActionResult> AddAsync([FromBody] TAddRequest request);

    [HttpGet]
    public abstract Task<IActionResult> ListAsync();

    [HttpGet("{id:long}")]
    public abstract Task<IActionResult> GetAsync([FromRoute] long id);

    [HttpPatch("{id:long}")]
    public abstract Task<IActionResult> UpdateAsync([FromRoute] long id, [FromBody] TUpdateRequest request);

    [HttpDelete("{id:long}")]
    public abstract Task<IActionResult> DeleteAsync([FromRoute] long id);
}
