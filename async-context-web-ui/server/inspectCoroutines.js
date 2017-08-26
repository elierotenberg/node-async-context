const extractCoroutines = (
  rootCoroutines,
  rootResources,
  prevCoroutine,
  prevResource,
  currentNode,
) => {
  const currentResource = {
    resourceId: currentNode.resourceId,
    type: currentNode.type,
    lifecycleStatus: currentNode.lifecycleStatus,
    location: currentNode.location,
    annotations: Array.from(
      currentNode.annotations.entries(),
    ).reduce((obj, [key, value]) => {
      obj[key] = value;
      return obj;
    }, {}),
    children: [],
  };

  if (prevResource) {
    prevResource.children.push(currentResource);
  } else {
    rootResources.push(currentResource);
  }

  if (currentResource.annotations.coroutine) {
    const currentCoroutine = {
      id: currentResource.annotations.coroutine.id,
      name: currentResource.annotations.coroutine.name,
      resourceId: currentResource.resourceId,
      lifecycleStatus: currentResource.lifecycleStatus,
      location: currentResource.location,
      children: [],
    };

    if (prevCoroutine) {
      prevCoroutine.children.push(currentCoroutine);
    } else {
      rootCoroutines.push(currentCoroutine);
    }

    for (const childNode of currentNode.children) {
      extractCoroutines(
        rootCoroutines,
        rootResources,
        currentCoroutine,
        currentResource,
        childNode,
      );
    }
  } else {
    for (const childNode of currentNode.children) {
      extractCoroutines(
        rootCoroutines,
        rootResources,
        prevCoroutine,
        currentResource,
        childNode,
      );
    }
  }
};

const inspectCoroutines = monitor => {
  const rootCoroutines = [];
  const rootResources = [];
  for (const rootNode of monitor.getRootNodes()) {
    extractCoroutines(rootCoroutines, rootResources, null, null, rootNode);
  }
  return { rootCoroutines, rootResources };
};

module.exports = inspectCoroutines;
