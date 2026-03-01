# Order of questions in assignment

- order must be done by book name order -> topic order -> step order -> question order
- questions in pdf is grouped by book and topic. should this be included in schema? review assignment includes this nested book?

# query review-needed questions by classroom

- review assignment must be created by classroom, (if no classroom is assigned, consider this as private classroom) so I need to query need-to-be-reviewed-attempts by classroom. how would this affect schema?
- difficult edge cass is following
    - student is assigned at two different classroom, and the same syllabus is used there, so he is assigned same session in different classrooms. question attempts need to be tracked separately, if we allow this. what do you recommend? disallow this action? or can it be tracked easily with your current model(or with minor modification)?
