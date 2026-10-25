begin;

insert into public.education_levels (code, name, position)
values
  ('PRIMARY', 'Tiểu học', 10),
  ('LOWER_SECONDARY', 'Trung học cơ sở', 20),
  ('UPPER_SECONDARY', 'Trung học phổ thông', 30)
on conflict (code) do update
set name = excluded.name,
    position = excluded.position,
    active = true;

insert into public.grade_levels (education_level_id, code, name, position)
select level.id, grade.code, grade.name, grade.position
from (
  values
    ('PRIMARY', 'GRADE_1', 'Lớp 1', 10),
    ('PRIMARY', 'GRADE_2', 'Lớp 2', 20),
    ('PRIMARY', 'GRADE_3', 'Lớp 3', 30),
    ('PRIMARY', 'GRADE_4', 'Lớp 4', 40),
    ('PRIMARY', 'GRADE_5', 'Lớp 5', 50),
    ('LOWER_SECONDARY', 'GRADE_6', 'Lớp 6', 60),
    ('LOWER_SECONDARY', 'GRADE_7', 'Lớp 7', 70),
    ('LOWER_SECONDARY', 'GRADE_8', 'Lớp 8', 80),
    ('LOWER_SECONDARY', 'GRADE_9', 'Lớp 9', 90),
    ('UPPER_SECONDARY', 'GRADE_10', 'Lớp 10', 100),
    ('UPPER_SECONDARY', 'GRADE_11', 'Lớp 11', 110),
    ('UPPER_SECONDARY', 'GRADE_12', 'Lớp 12', 120)
) as grade(level_code, code, name, position)
join public.education_levels level on level.code = grade.level_code
on conflict (code) do update
set education_level_id = excluded.education_level_id,
    name = excluded.name,
    position = excluded.position,
    active = true;

insert into public.subjects (code, name, position)
values
  ('MATH', 'Toán học', 10),
  ('LITERATURE', 'Ngữ văn', 20),
  ('ENGLISH', 'Tiếng Anh', 30),
  ('PHYSICS', 'Vật lý', 40),
  ('CHEMISTRY', 'Hóa học', 50),
  ('BIOLOGY', 'Sinh học', 60),
  ('HISTORY', 'Lịch sử', 70),
  ('GEOGRAPHY', 'Địa lý', 80),
  ('INFORMATICS', 'Tin học', 90),
  ('NATURAL_SCIENCE', 'Khoa học tự nhiên', 100),
  ('CIVIC_EDUCATION', 'Giáo dục công dân', 110),
  ('OTHER', 'Môn học khác', 999)
on conflict (code) do update
set name = excluded.name,
    position = excluded.position,
    active = true;

insert into public.grade_subjects (grade_level_id, subject_id)
select grade.id, subject.id
from public.grade_levels grade
cross join public.subjects subject
where grade.active and subject.active
on conflict do nothing;

commit;
