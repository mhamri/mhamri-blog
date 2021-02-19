---
title: 'AspNetCoreOData 8.0-preview feedback, when dotNet developers write PHP code!'
slug: asp-net-core-o-data-8-0-preview-when-dotnet-developers-write-php-code
description: a collection of feedback at functional and code level about Asp.net core 5 OData 8.0 package
date: 2021-02-15 23:27:56
author: Mohammad Hossein Amri
tags: ['OData', 'AspNetCore', 'C#']
cover: https://source.unsplash.com/featured/?textures-patterns
fullScreen: false
excerpt: the Microsoft.AspNetCore.OData version 8 is about to release, and after reading their code, I noticed a lot of red flags. Learn why it's one of the worst updates the OData on asp.net core is going to receive.
---

I was looking into the new routing in OData, and pretty much I should say I don't like it. More or less, this new pattern is useful if someone wants to have the OData as the only API option or wants to maintain two different endpoints (one normal and another OData one) side by side. Still, it's not the real-world scenario. We have controllers that are already in place, services that are in production.

Moreover, it's a regression from v7. It doesn't support [WebApi](https://docs.microsoft.com/en-us/odata/webapi/first-odata-api) anymore. I tried to configure the v8, and since there is not much documentation available yet, I started to read their code, and oh boy! It's wrong at many levels. Though some of those codes are moved forward from the old OData libraries, today, in 2021, it's a big question why we need to configure the OData similar to WCF and ASP.NET form?

The v8 (if they don't reconsider) brings many conventions that only a PHP developer could think about. instead of changing those old patterns for something better built for modern Asp.net Core, the v8 added more awkward conventions to the recipe. I can't understand why v8 should create these many conventions that aren't configurable, not following SOLID, and not built for asp.net core.

Here, I compiled a set of problems that I saw in the OData 8 that I hope to change before the release; if not, we need to ditch OData and think about other options. GraphQL is a good and feasible option, and recently AutoMapper quietly is working on a [OData Mapper](https://github.com/AutoMapper/AutoMapper.Extensions.OData) to create OData like queries on top of `IQueryable<>` that I am looking forward to trying.

# What is Routing Convention?

In v8, a couple of routing conventions are added, so the user can configure how the OData finds the controllers and responds to a request.

You can create classes that inherit from one of those base convention classes and set an order for them. Once your app receives a request, the OData calls those classes based on the order you've selected, and if one of those classes returns true, that Controller is an OData controller.

there is one interface and one class related to this:

1- `IODataControllerActionConvention`: this one is the interface; you can choose your condition to choose a controller and action. It has an `AppliesToController()` method which returns a boolean, and if it returns true, then it's an OData controller, then there is another method, `AppliesToAction()`. It decides which of those methods in the controller gets called.

1- `OperationRoutingConvention`: this is an abstract class (which implements `IODataControllerActionConvention`). as long as an `EntitySet` or `Singleton` is available in the context, it lets you decide what action method to call on a controller. Later we see that any conventions that implement this class are not good for an under-heavy development app, and the only feasible built-in convention is Attribute routing. Also, we discuss why this base class is one of the main problems in v8.

# PHP like routing conventions

One of the conventions that register `/$metadata` as a predefined URL in your app is in `MetadataRoutingConvention.cs`.

```Csharp {14,22} {codeTitle: "MetadataRoutingConvention.cs"}
public virtual bool AppliesToAction(ODataControllerActionContext context)
{
    if (context == null)
    {
        throw Error.ArgumentNull(nameof(context));
    }

    Debug.Assert(context.Controller != null);
    Debug.Assert(context.Action != null);
    ActionModel action = context.Action;
    string actionName = action.ActionMethod.Name;

    // for ~$metadata
    if (actionName == "GetMetadata")
    {
        ODataPathTemplate template = new ODataPathTemplate(MetadataSegmentTemplate.Instance);
        action.AddSelector("Get", context.Prefix, context.Model, template, context.RouteOptions);
        return true;
    }

    // for ~/
    if (actionName == "GetServiceDocument")
    {
        ODataPathTemplate template = new ODataPathTemplate();
        action.AddSelector("Get", context.Prefix, context.Model, template, context.RouteOptions);
        return true;
    }

    return false;
}
```

and I dropped my jaw when I saw this code

![](https://media.giphy.com/media/3o84U9nMOmiAGfjYkw/giphy.gif)

yea, instead of checking if the Controller implements a specific interface or reflection or attribute or whatnot (or another 100 different way the dotnet has), the action is selected based on some string comparison (if it's not a PHP code, then what is it?)

More strange, there is a check to call only a specific type of Controller, and still, they are checking method names with string! Looking at the `MetadataController` class, it is inheriting from `ControllerBase`. So, it's just a normal controller which could define its route just right there. Moreover, the methods in `MetadataController` are not `virtual`, so we can't even override them; then what is this convention for?

```csharp{1,18} {codeTitle: "MetadataRoutingConvention.cs"}
    private static TypeInfo metadataTypeInfo = typeof(MetadataController).GetTypeInfo();

    /// <summary>
    /// Gets the order value for determining the order of execution of conventions.
    /// Metadata routing convention has 0 order.
    /// </summary>
    public virtual int Order => 0;

    /// <inheritdoc />
    public virtual bool AppliesToController(ODataControllerActionContext context)
    {
        if (context == null)
        {
            throw Error.ArgumentNull(nameof(context));
        }

        // This convention only applies to "MetadataController".
        return context.Controller.ControllerType == metadataTypeInfo;
    }
```

# is there any other example?

Not enough of hardcoding? You will be satisfied with this one! in `OperationImportRoutingConvention` you can find code that even the controller's name is hardcoded. So if you want to make this convention works and add some operations to OData; you need to create a controller with exactly this name.

```csharp{10}  {codeTitle: "OperationImportRoutingConvention.cs"}
public virtual bool AppliesToController(ODataControllerActionContext context)
{
    if (context == null)
    {
        throw Error.ArgumentNull(nameof(context));
    }

    // By convention, we look for the controller name as "ODataOperationImportController"
    // Each operation import will be handled by the same action name in this Controller.
    return context.Controller?.ControllerName == "ODataOperationImport";
}
```

# What is the EntitySet?

before I start you should know what is EDM. I quote right from [this article](https://devblogs.microsoft.com/odata/simplifying-edm-with-odata/)

> EDM is short for Entity Data Model, it plays the role of a mapper between whatever data source and format you have and the OData engine.<br><br> In other words, whether your source of data is SQL, Cosmos DB or just plain text files, and whether your format is XML, Json or raw text or any other type out there, What the entity data model does is to turn that raw data into entities that allow functionality like count, select, filter and expand to be performed seamlessly through your API.

?> When you create those EDM models you need to name them, I refer to those names as **EDM-Name**

There is a weird convention in the OData library that is carried forward for ages, and your EDM name is dictating your controller name.

This one had a [workaround in v7](https://docs.microsoft.com/en-us/odata/webapi/first-odata-api), but in v8, it becomes mandatory that your EDM name must be in your path.

here are some example

-   `~/some/route/EDM-Name`
-   `~/some/route/prefix/EDM-Name`
-   `~/EDM-Name`

There is no way you work around it. In v8, your controller name should match your EDM, or you hardcode it yourself with the help of `[ODataRoutePrefix]`.

Maybe you ask why it's a terrible idea? Because each time you refactor something, you don't want your URL change. Or when you change the EDM name, you go and rename your Controller.

unfortunately now it's enforced in `ODataRoutingApplicationModelProvider.cs`

```csharp{8} {codeTitle: "ODataRoutingApplicationModelProvider.cs"}
private static ODataControllerActionContext BuildContext(string prefix, IEdmModel model, ControllerModel controller)
{
    // The reason why to create a context is that:
    // We don't need to call te FindEntitySet or FindSingleton before every convention.
    // So, for a controller, we try to call "FindEntitySet" or "FindSingleton" once.
    string controllerName = controller.ControllerName;

    IEdmEntitySet entitySet = model.EntityContainer.FindEntitySet(controllerName);
    if (entitySet != null)
    {
        return new ODataControllerActionContext(prefix, model, controller, entitySet);
    }

    IEdmSingleton singleton = model.EntityContainer.FindSingleton(controllerName);
    if (singleton != null)
    {
        return new ODataControllerActionContext(prefix, model, controller, singleton);
    }

    return new ODataControllerActionContext(prefix, model, controller);
}
```

As you can see in the code when OData is building the context, based on your Controller name, it sets your `EntitySet`; the only exception is if you use `ODataAttributeConvention` (which you need to hardcode it yourself!). The `EntitySet` (which is equal to your controller name) defines what EDM to use; isn't it strange? Your action return type could be translated to your EDM, but instead, your EDM needs to be discovered from some hardcoded string.

# What's wrong with EDM name as the controller name

This kind of convention may be expected in JS and PHP world but uncommon to the dotnet world.

-   we don't know if the route is discovered by the OData until we run the application.
-   if you want to rename a controller -> you need to rename the EDM.
-   if you're going to rename an EDM -> you need to rename a controller
-   you rename an EDM or a Controller and it will result in URL change.

So, everyone to avoid URL changes will eventually use the `ODataRouteAttributeConvention` attribute to prevent binding the controller name to EDM-name, making most of the built-in conventions useless.

# Action selection

Other than how the controller names are bound to the EDM-name, more hardcoded stuff is going on when selecting the action method in those controllers.

For example, in `EntityRoutingConvention.cs` like other conventions, it first checks if your controller name matches one of the EDM-names, then it searches for a method name that matches this pattern: `{HttpMethod}{EntityTypeName}`

in this pattern, the `{HttpMethod}` can be any of `Get`, `Post`, ... (which could be handled by standard HTTP attributes), and `{EntityTypeName}` matches with a child property (that should be navigation) of `EntitySet` (which is equal to your controller name)

-   you remove a property from your entity, you need to come and remove a related action, you rename a property, you need to go to the Controller and update the action name. each time you refactor an entity, you need to go and refactor a controller! which can cause the API changes. Potentially breaking third-party and internal libraries.
-   action method names can't be refactored without an OData consideration.
-   it's following very rigid convention.
-   and none of this is discoverable at the build time.

These string conventions and manipulations could be omitted and implemented more manageable with just some attributes (same as what Asp.net core is doing).

One more strange thing about the EDM-name as the controller is that you can't decide which controller is OData controller and which one isn't. If you have a controller that matches the EDM-name, you should pray to not have a method with the `GET` name in it. And if you want to have an OData controller, but for some reason, it doesn't work, please go and check your spelling first!

Just imagine that poor developer that headdesk\* because he wants to create one OData controller (me). He creates the Controller, maps it to the route, and nothing works just because the action name doesn't have the same name as what is hardcoded in here. And you guess it right; even it's not an `OrdinalIgnoreCase` comparison.

###### \*headdesk

![](https://media.giphy.com/media/IMDnZv2BzKvPa/giphy.gif)

# any more examples?

if you want the worst one, you need to look into `NavigationRoutingConvention.cs`

same as the other conventions, you need to have a controller that matches the EDM name. then you need to have an action that match this pattern : `{HttpMethod}{childEntitySecondLevel}From{childEntity}`

-   the `HttpMethod` match to `Get`, `PostTo`, `PutTo`, `PatchTo`. and god knows, for example, why should be `PostTo` and not `Post`.
-   the `childEntity` is a navigational property on your `EntitySet` (remember controller name? :smile:)
-   and you should have `From` somewhere in the action name!
-   the `childEntitySecondLevel` is a property on the `childEntity`

If all of these matches, then OData calls that action.

# Assuming all of the actions has `ODataRouteAttribute`

So you are a clever one; you don't want to rename your class each time that you change something in your EDM; you want to use attributes; here is how:

You need to hardcode the name of EDM inside `ODataRoutePrefix`. Still, You need to hardcode the EDM name, either in this attribute or in the controller name, choose your poison.

```csharp {2}
[Route("api")]
[ODataRoutePrefix("EdmName")]
public class SomeOtherNameController : ControllerBase{}
```

So when your controller looks like this, your route is: `~/api/EdmName`.

Next, you need to have some actions with `[ODataRoute]`, and it's mandatory; any action without this will be ignored.

there are three things wrong with this:

1. it's a redundant selection mechanism, while standard HTTP attributes like `[HttpGet]` could be sufficient.
1. it is doing the same thing as `[Route]` could do.
1. and why adding `[EnableQuery]` isn't enough?

# not using `[Route]`

I understand that these conventions supposed to add some values, but after going through all of these, my only question was, why not use the `[Route()]`? Creating like eight conventions, one worst than another one, and yet, none of them implement the basis of what `[Route()]` is providing.

In v8 new routing, a routing attribute is introduced that doesn't provide even 10% of what built-in `[Route]` could do. If the specification of OData is this much important and you want to make sure instead of `~/api/Entity/1`, you end up with `~/api/Entity(1)`, then why not inherit the `Route` attribute and use the built-in functionalities.

Or why not introduce a new middleware that translates OData URLs to a standard rest API?

# Not supporting WebApi anymore

for example, I have the following routes

`/api/projects/{projectId}/activities`
`/api/projects/{projectId}/activities/{activityId}`

Imagine if I want to introduce the OData query capabilities only on these two already in production routes. With the new routing, I'm forced to add `ODataRouteAttribute` on top of those actions and rewrite the route with a new prefix, making it two different endpoints.

But why not use the data and routing information is available in the `[Route()]` attribute?

# EDM requirement

Another thing that is changed in v8 that wasn't in v7 is that you have to define EDM. as you saw, the EDM name dictates the controller name or `[ODataRoutePrefix]` input which will be used to find the `EntitySet`. The v8 doesn't work without EDM and everything you've specified in your EF, automapper, and whatnot; again, you need to redefine a portion of that as EDM. So, a big question is, why is the EDM still a must-have requirement while it could be auto-discovered.

moreover, our action method is returning `IQueryable`, which could be projected to anything, so is defining an EDM necessary? did you see how [mapster](https://github.com/MapsterMapper/Mapster) or [automapper](https://automapper.org/) or [chocoloate](https://chillicream.com/docs/hotchocolate/) works?

# `ODataRoutePrefixAttribute` doesn't to set the prefix

The next issue with v8 is the code architectures; for example, I give you the `[ODataRoutePrefix]` and ask you to put it on top of the class. you look it and see that both argument in the constructor is optional; so based on the attribute name and constructor argument you should guess what it does. What do you think this attribute is doing?

looking on its name, you will probably say, setting prefix and if I put it on top of any controller it should works, none of the arguments are necessary! But no, you are wrong; the main thing this attribute is doing is setting `EntitySet`, if you don't pass the template argument (which actually is about EDM-name) in the constructor it doesn't work, and prefix is totally optional. but you know, it's called "Prefix Attribute"! #Kudos to whoever named it.

Until I read the code, I didn't understand that this one is not about to set the prefix (which it also can do), but its main job is to set the `EntitySet`.

and what is the prefix? there is a concept of `prefix` in the OData EDM model that let you define multiple EDM and give them a name (version them)

```csharp {6-7}{codeTitle: "startup.cs"}
public void ConfigureServices(IServiceCollection services)
{

    ...

    services.AddOData(opt => opt
        .AddModel(GetEdmModel())
    );

    ...

}
```

With the code above, Your API URL becomes `~/MyEntity`.

but you can also `prefix` your EDM

```csharp {7-8}{codeTitle: "startup.cs"}
public void ConfigureServices(IServiceCollection services)
{

    ...

    services.AddOData(opt => opt
        .AddModel("myPrefix", GetEdmModel1())
        .AddModel("my2ndPrefix", GetEdmModel2())
    );

    ...

}
```

With the code above, Your API URL becomes `~/myPrefix/AnEntityDefinedInGetEdmModel1` and `~/my2ndPrefix/AnEntityDefinedInGetEdmModel2`

and if you combine `ODataRoutePrefixAttribute` with `[Route]`, you will end up with a strange result

```csharp
[Route("api/[controller]")]
[ODataRoutePrefix("EntityName", "myPrefix")]
public class SomeControllerNameController : ControllerBase{}

```

Yup your route becomes `~/api/SomeControllerName/myPrefix/StoreModel`

Then you have `[ODataRoute]`, which also accepts a prefix, so given the code below, what do you think it would do?

```csharp{7}
[Route("api/[controller]")]
[ODataRoutePrefix("EntityName", "myPrefix")]
public class SomeControllerNameController : ControllerBase{


    [HttpGet]
    [ODataRoute("template", "myPrefix2")]
    public IQueryable<EntityModel> Get()
    {

    }

}
```

My immediate guess was, it should be like `[Route]`; if you have some route on a class, the action's `[Route]` should rewrite or append to the class one. But I was wrong; it silently ignores your action (even you already put a `[ODataRoute]` on top of that!) because your action prefix doesn't match the class prefix.

Moreover, `[ODataRoute]` supports a template as the first argument; I had some good time figuring out what that could do. I leave you to figure it out by yourselves :smiling_imp:!

# WebApi support

As I mentioned earlier, v8 lost the support for WebAPI, so if you are looking to add querying abilities of the OData to your none OData API, then good luck with that. You need to write your own convention. Also, you must define the EDM (which literally nowadays it's redundant). Then, you need to set your `EntitySet` either by creating a controller with the same name or using `[ODataRoutePrefix]` and setting it manually. Then add `[ODataRoute]` and `[EnableQuery]` on top of your action method. Your only challenge is to figure out what your outcome URL will look like; after a little guessing, maybe you get it right or just use a [helper middleware](https://github.com/OData/AspNetCoreOData/blob/2ea300651db9f608b57bfb3314ded96bc76a6fa4/sample/ODataRoutingSample/Extensions/ODataRouteHandler.cs) that is available in the OData sample.

# minor bug

Though v8 is in preview, there is still a bug that makes all of the conventions (except `AttributeRoutingConvention`) useless!

When you add the OData in your `startup.cs` you **have to** use `AddModel`, but one good change about it is, now you don't need to set up a prefix (do you remember [prefix](#odatarouteprefixattribute-doesnt-to-set-the-prefix)? :smile:)

When you don't set the prefix, v8 default the prefix to an empty string and save it inside a dictionary. Then, when it wants to read the prefix, it checks if it's null or not, and if it is, then it will return false, which means the prefix is wrong or not found.

```csharp {7,14}{codeTitle:"ODataOptions.cs"}
public class ODataOptions{

    ...

    public ODataOptions AddModel(IEdmModel model)
    {
        return AddModel(string.Empty, model, configureAction: null); //here it set prefix as string.Empty
    }

    ...

    public IServiceProvider GetODataServiceProvider(string prefix)
    {
        if (prefix != null && Models.ContainsKey(prefix))
        {
            return Models[prefix].Item2;
        }

        return null;
    }

    ...
}
```

As mentioned, the only exception is when you want to use `AttributeRoutingConvention`, because when you set `[ODataRoutePrefix]`, you are already setting the prefix to an empty string. So if you want to try all those conventions, make sure that you use a prefix.

# let's talk about OData architecture

OData is strong, but it's old. It doesn't follow today's best practices. For example, in each tutorial you pick today, you can see that the API delimiter is slash or comma. While in a normal api `~/api/Entity/{id}` is considered following the best practice, the OData tries to make it look like a function `~/api/Entity({id})`. if something is obsolete is the specification fault, but why the implementation follows each step of the specification? I think what maintainers of this library are getting it wrong is that they put the specification and implementation in one basket, which actually are two different things, and they don't need to always match each other.

For example, an OData middleware could just receive `~/api/Entity({id})` and map it into a controller with the standard routing. Instead of enforcing strange alienated conventions to the dotnet echo system, they could handle things much elegantly.

It could follow the OData specification just by mapping what a standard API is providing. We already know how to define an action that answers GET or POST; why do we need to reinvent the wheel and define a new way of doing that?

While in WCF, maybe EDM was necessary, today literally, we don't need them. if you don't believe it, look at GraphQl, look at GRPC, even OData library itself already includes the `ODataConventionModelBuilder` which [do all the magic](https://devblogs.microsoft.com/odata/simplifying-edm-with-odata/) behind the scene, and you just can override anything that seems necessary (spoiler, you won't see that necessary!)

OData could become a heroine for any API. But unfortunately, a specification clouded the mind of the developers. The library developers confused themselves with the border between specification and implementation. These two could be two different things. And if it was the case today, adding OData doesn't seem like implementing WCF in Asp.net core.

If you look at OData specification, literally, it doesn't have anything that couldn't be translated into a standard API. If you look at other [third party OData implementation](https://github.com/voronov-maxim/OdataToEntity), you can see that it's doable, but still, the OData library itself fails on doing that. Something that could be handled by some middleware and action filter and attribute is done in such a messy way.

here is the pseudo-code of what I hoped and wished about the OData

```Csharp

[ApiController]
[ODataRoutePrefix("odata{apiVersion}")] //here it set prefix not a template
[Route("api/v{version:apiVersion}/[controller]")]   // this is the template, if you really want to enforce OData
                                                    // you could write a wrapper that inherit from RouteAttribute
                                                    // and get a second parameter of typeOf(Entity)
                                                    // though a middleware could translate OData url to normal
                                                    // api url and call the controller
[ApiVersion("1.0")]
[Authorize]
public class StoresProjectedController : ControllerBase
{
    private readonly IMapper _mapper;
    private readonly MyContext _context;

    public StoresProjectedController( IMapper mapper, MyContext context)
    {
        _mapper = mapper;
        _context = context;
    }

    [HttpGet]
    [EnableQuery]
    [AllowAnonymous] // still supports identity and what not
    public ODataActionResult<IQueryable<StoreModel>> Get()  // the return value should define the EntitySet,
                                                            // not like the `ODataRoutePrefix` that need a
                                                            // hardcoded string
                                                            // and why do we need an entity set? It's IQueryable,
                                                            // and it can be projected
                                                            // You should be able to return IEnumerable
                                                            // or IQueryable of ActionResult, atm it doesn't support
                                                            // the return of ActionResult and only support Task<>
    {
        var someRule=false;
        if (someRule){
            return BadRequest(); //still we should have some check in place and be able do this,
                                 // currently it's not doable
        }
        return Ok(_context.Store.ProjectTo<StoreModel>(_mapper)); // who said we need to pass
                                                                  //the entity in here, let's project it!
    }

    [HttpGet]
    [Route("{id}")] //middleware take care of this and whenever get a request to ~/api/Entity(id),
                    //it will pass it to here
    public ODataActionResult<IQueryable<StoreModel>> Get2(int id)
    {}

    [ODataFunction]  // you should be able to define a function on an Entity;
                     // we don't need to do this on EDM
    public ActionResult SomeFunction(int id)
    { }

    [ODataFunction]
    public ActionResult SomeFunction(int id, string someVar) // and it can have overloaded
    { }

    [HttpDelete]
    public ActionResult SomeNameThatDoesntHaveHttpVerbInIt(int id) // we could support any http verb,
                                                                   // you don't need a function with Delete in its name
    { }

    [HttpGet]
    [EnableQuery] // you have a normal ActionResult (not ODataActionResult)
                  // that just need to enable projection on it
    [Route("{id:[0-9]}")] //still built in functions like regex in routes works
    public ActionResult<IQueryable<StoreModel>> Get(int id) // we can have normal action that the result doesn't
                                                            // get translated to OData format
    {
        return Ok(_context.Store.Where(x=> x.id==id).ProjectTo<StoreModel>(_mapper));
    }


    [HttpGet]
    [Consumes("OData/header()")]    //if you need more way to translate OData URL to standard API,
                                    // consume header is there to add more capabilities.
                                    // you get an OData url, middleware translate it and add
                                    // the necessary header, rest is magic
    public ODataActionResult<IQueryable<StoreModel>> GetWithHeader() // this return result in OData format
                                                                     // but query isn't enabled in here
    { }
}
```

I am sure what I wrote here doesn't support 100% of OData scenarios and needs to work more on it, and it's just a design idea. OData is so strong that I'm amazed why the OData team didn't write a GraphQL wrapper for that. Imagine a middleware that map any GraphQL request to an OData query, and another middleware map OData Url to standard API convention.

# Summary

We learned, the OData v8 is trying very hard to enforce OData specification (as hard as hardcoding function names for you!). There is a better way of doing it to run new blood into OData implementation.

The v8, let us create our own routing convention, but there are so many other pieces that don't fit, and since they are internal, there is no way to override them (like the `EntitySet` requirement).
