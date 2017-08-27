const React = require('react');
const PropTypes = require('prop-types');

const humanizeAge = require('../util/humanizeAge');

const CoroutineSelection = ({ resource, coroutine }) =>
  <div className="CoroutineSelection">
    <InfoTable
      infos={{
        coroutineName: coroutine.name,
        coroutineId: coroutine.id,
        age: humanizeAge(resource.ageInMs),
        resourceId: resource.resourceId,
        parentResourceId: resource.parentResourceId,
        executionAsyncId: resource.executionAsyncId,
      }}
    />
  </div>;
CoroutineSelection.propTypes = {
  resource: PropTypes.object,
  coroutine: PropTypes.object,
};

const ResourceSelection = ({ resource }) => null;
ResourceSelection.propTypes = {
  resource: PropTypes.object,
};

const Selection = ({ selection }) => {
  if (selection === null) {
    return null;
  }
  const [type, resource, coroutine] = selection;
  if (type === Selection.Resource) {
    return <ResourceSelection resource={resource} />;
  }
  if (type === Selection.Coroutine) {
    return <CoroutineSelection resource={resource} coroutine={coroutine} />;
  }
  return null;
};

Selection.propTypes = {
  selection: PropTypes.array,
};

Selection.Resource = 'Resource';
Selection.Coroutine = 'Coroutine';

module.exports = Selection;
